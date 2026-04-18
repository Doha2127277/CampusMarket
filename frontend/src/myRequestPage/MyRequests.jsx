import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import './MyRequests.css';

function MyRequests() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [grants, setGrants] = useState([]);
  const [sellersNames, setSellersNames] = useState({});
  const [loading, setLoading] = useState(true);
  
  // الحالة المسؤولة عن تخزين النص المكتوب لكل طلب/منحة
  const [commentText, setCommentText] = useState({});
  
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'orders');

  useEffect(() => {
    fetchAllData();
    if (location.state?.activeTab) {
        setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const fetchAllData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const qOrders = query(collection(db, "orders"), where("buyerId", "==", auth.currentUser.uid));
      const orderSnap = await getDocs(qOrders);
      const orderData = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const qGrants = query(collection(db, "volunteer_requests"), where("requesterId", "==", auth.currentUser.uid));
      const grantSnap = await getDocs(qGrants);
      const grantData = grantSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setOrders(orderData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setGrants(grantData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));

      const allSellers = [...new Set([...orderData.map(o => o.sellerId), ...grantData.map(g => g.sellerId)])];
      const namesMap = {};
      await Promise.all(allSellers.map(async (sId) => {
        if (!sId) return;
        const userDoc = await getDoc(doc(db, "users", sId));
        if (userDoc.exists()) namesMap[sId] = userDoc.data().fullName || "Campus User";
      }));
      setSellersNames(namesMap);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // دالة إرسال التعليق (نفس منطق الموبايل)
  const handleAddComment = async (id, collectionName) => {
    const text = commentText[id];
    if (!text || text.trim() === "") return;

    try {
      const docRef = doc(db, collectionName, id);
      const newComment = {
        text: text.trim(),
        senderId: auth.currentUser.uid,
        senderRole: 'buyer',
        createdAt: new Date().toISOString()
      };

      await updateDoc(docRef, {
        comments: arrayUnion(newComment)
      });

      setCommentText(prev => ({ ...prev, [id]: "" }));
      fetchAllData(); 
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending_admin': return 'Under Verification (Admin)';
      case 'pending_donor': return 'Waiting Donor Approval';
      case 'approved': return 'Grant Approved ✅';
      default: return status || 'Pending';
    }
  };

  const displayedGrants = activeTab === 'grants' && location.state?.fromHeart 
    ? grants.filter(g => g.status !== 'approved') 
    : grants;

  // وظيفة عرض الشات (تستخدم الـ CSS Classes الخاصة بكِ)
  const RenderChat = (item, collectionName) => (
    <div className="chat-area-web">
      <p className="chat-title-web">Chat with Seller/Donor</p>
      <div className="messages-list-web">
        {item.comments?.map((c, i) => (
          <div key={i} className={`msg-bubble-web ${c.senderId === auth.currentUser.uid ? 'me' : 'seller'}`}>
            <span className="sender-name-web">{c.senderId === auth.currentUser.uid ? "Me" : "Partner"}</span>
            <p className="msg-text-web">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="chat-input-web">
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={commentText[item.id] || ""}
          onChange={(e) => {
            const val = e.target.value;
            setCommentText(prev => ({ ...prev, [item.id]: val }));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddComment(item.id, collectionName);
          }}
        />
        <button className="send-btn-web" onClick={() => handleAddComment(item.id, collectionName)}>Send</button>
      </div>
    </div>
  );

  if (loading) return <div className="loading-state">Loading...</div>;

  return (
    <div className="my-requests-container">
      <header className="main-header-web">
        <h1 className="main-title-web">Activity Center</h1>
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} 
            onClick={() => setActiveTab('orders')}
          >
            My Orders 🛒
          </button>
          <button 
            className={`tab-btn ${activeTab === 'grants' ? 'active' : ''}`} 
            onClick={() => setActiveTab('grants')}
          >
            {location.state?.fromHeart ? "Pending Grants ❤️" : "My Grants ❤️"}
          </button>
        </div>
      </header>

      <div className="orders-grid">
        {activeTab === 'orders' ? (
          orders.length === 0 ? <div className="no-orders">No orders found.</div> : 
          orders.map(order => (
            <div key={order.id} className="order-card-web">
              <div className={`status-bar ${order.status?.toLowerCase()}`}>
                <span className="date-text">{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : "Recently"}</span>
                <span className="status-label">{order.status || "Pending"}</span>
              </div>
              <div className="order-items-list">
                {order.items?.map((item, i) => (
                  <div key={i} className="item-row">
                    <img src={item.photoURL} alt={item.name} className="prod-img-web" />
                    <div className="item-info">
                      <h4 className="prod-name-web">{item.name}</h4>
                      <p className="prod-price-web">{item.price} EGP</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* جزء الشات في قسم الطلبات */}
              {RenderChat(order, "orders")}

              <div className="order-footer-web">
                <span>Seller: {sellersNames[order.sellerId] || "Loading..."}</span>
                <span className="total-amount-web">{order.totalAmount} EGP</span>
              </div>
            </div>
          ))
        ) : (
          displayedGrants.length === 0 ? <div className="no-orders">No pending grants found.</div> : 
          displayedGrants.map(grant => (
            <div key={grant.id} className="order-card-web volunteer-card">
              <div className={`status-bar ${grant.status}`}>
                <span className="date-text">Request Date: {grant.createdAt?.seconds ? new Date(grant.createdAt.seconds * 1000).toLocaleDateString() : "Recently"}</span>
                <span className="status-label volunteer-status">{getStatusText(grant.status)}</span>
              </div>
              <div className="item-row" style={{padding: '15px'}}>
                 <div className="item-info">
                    <h4 className="prod-name-web" style={{fontSize: '1.2rem'}}>{grant.productName}</h4>
                    <p className="prod-price-web" style={{color: '#3b82f6'}}>Volunteer Item (Free)</p>
                 </div>
              </div>

              {/* جزء الشات في قسم المنح */}
              {RenderChat(grant, "volunteer_requests")}

              <div className="order-footer-web">
                <span>Donor: {sellersNames[grant.sellerId] || "Reviewing..."}</span>
                {grant.status === 'approved' && (
                  <button className="contact-btn-small">Contact Donor</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyRequests;
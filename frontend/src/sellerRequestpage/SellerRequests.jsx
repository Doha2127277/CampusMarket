import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './SellerRequests.css';

function SellerRequests() {
  const [orders, setOrders] = useState([]); // المبيعات العادية
  const [donations, setDonations] = useState([]); // طلبات التبرع
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});
  const [activeTab, setActiveTab] = useState('sales'); // التبديل بين المبيعات والتبرعات

  useEffect(() => {
    if (!auth.currentUser) return;

    // 1. مراقبة المبيعات العادية (Orders)
    const qOrders = query(collection(db, "orders"), where("sellerId", "==", auth.currentUser.uid));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    // 2. مراقبة طلبات التبرع (Volunteer Requests)
    const qDonations = query(
      collection(db, "volunteer_requests"), 
      where("sellerId", "==", auth.currentUser.uid),
      where("status", "in", ["pending_donor", "approved", "rejected"])
    );
    const unsubscribeDonations = onSnapshot(qDonations, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDonations(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeDonations();
    };
  }, []);

  // دالة إرسال التعليق (المنطق البرمجي)
  const handleAddComment = async (id, collectionName) => {
    const text = commentText[id];
    if (!text || text.trim() === "") return;

    try {
      const docRef = doc(db, collectionName, id);
      const newComment = {
        text: text.trim(),
        senderId: auth.currentUser.uid,
        senderRole: 'seller', 
        createdAt: new Date().toISOString()
      };

      await updateDoc(docRef, {
        comments: arrayUnion(newComment)
      });

      // مسح النص بعد الإرسال
      setCommentText(prev => ({ ...prev, [id]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // وظيفة عرض الشات (UI) باستخدام الكلاسات الأصلية
  const RenderChat = (item, collectionName) => (
    <div className="chat-area-web">
      <p className="chat-title-web">Chat with Student</p>
      <div className="messages-list-web">
        {item.comments?.map((c, i) => (
          <div key={i} className={`msg-bubble-web ${c.senderId === auth.currentUser.uid ? 'me' : 'seller'}`}>
            <span className="sender-name-web">{c.senderId === auth.currentUser.uid ? "Me" : "Student"}</span>
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      alert(`Order ${newStatus}`);
    } catch (error) { console.error(error); }
  };

  const updateDonationStatus = async (reqId, newStatus) => {
    try {
      const status = newStatus === 'approved' ? 'approved' : 'rejected';
      await updateDoc(doc(db, "volunteer_requests", reqId), { status: status });
      alert(status === 'approved' ? "Donation Approved!" : "Request Declined.");
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="loading-state">Loading Manager...</div>;

  return (
    <div className="seller-requests-container">
      <header className="seller-header-web">
        <h1 className="seller-title-web">Provider Dashboard</h1>
        <div className="admin-tabs">
            <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>
                Commercial Sales ({orders.length})
            </button>
            <button className={activeTab === 'donations' ? 'active' : ''} onClick={() => setActiveTab('donations')}>
                Donation Approvals ({donations.length})
            </button>
        </div>
      </header>

      <div className="orders-grid-web">
        {activeTab === 'sales' ? (
          orders.length === 0 ? <div className="no-orders-web">No sales yet.</div> :
          orders.map((order) => (
            <div key={order.id} className="seller-horizontal-card">
              <div className="order-info-section">
                <div className={`status-badge-web ${order.status?.toLowerCase()}`}>{order.status || "Pending"}</div>
                <p className="buyer-name-web">Buyer: {order.buyerName || "Student"}</p>
                <div className="products-mini-list">
                  {order.items?.map((prod, i) => (
                    <div key={i} className="product-row-web">
                      <img src={prod.photoURL} alt="" className="mini-prod-img" />
                      <div className="mini-prod-info">
                        <span className="mini-name">{prod.name}</span>
                        <span className="mini-price">{prod.price} EGP</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* شات المبيعات */}
                {RenderChat(order, "orders")}

                {order.status === "pending" && (
                  <div className="seller-actions" style={{marginTop: '15px'}}>
                    <button className="approve-btn-web" onClick={() => updateOrderStatus(order.id, "approved")}>Approve</button>
                    <button className="reject-btn-web" onClick={() => updateOrderStatus(order.id, "rejected")}>Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          donations.length === 0 ? <div className="no-orders-web">No pending donations to approve.</div> :
          donations.map((req) => (
            <div key={req.id} className="seller-horizontal-card donation-card-style">
              <div className="order-info-section">
                <div className="status-badge-web verified">Verified by Admin ✅</div>
                <h3 className="donation-title">Item: {req.productName}</h3>
                <p className="buyer-name-web">Requested by: <strong>{req.requesterName}</strong></p>
                
                {/* شات التبرعات */}
                {RenderChat(req, "volunteer_requests")}

                {req.status === "pending_donor" && (
                  <div className="seller-actions" style={{marginTop: '20px'}}>
                    <button className="approve-btn-web" style={{backgroundColor: '#3b82f6'}} onClick={() => updateDonationStatus(req.id, "approved")}>
                      Confirm Donation 🎁
                    </button>
                    <button className="reject-btn-web" onClick={() => updateDonationStatus(req.id, "rejected")}>Decline</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SellerRequests;
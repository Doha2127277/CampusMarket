import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import './MyRequests.css';

function MyRequests() {
  const [orders, setOrders] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch Commercial Orders
    const unsubOrders = onSnapshot(query(collection(db, "orders"), where("buyerId", "==", auth.currentUser.uid)), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Volunteer/Grant Requests with original product data (Photo & Name)
    const unsubGrants = onSnapshot(query(collection(db, "volunteer_requests"), where("requesterId", "==", auth.currentUser.uid)), async (snapshot) => {
      const list = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        if (data.productId) {
          try {
            const pDoc = await getDoc(doc(db, "products", data.productId));
            if (pDoc.exists()) {
              return { 
                id: d.id, 
                ...data, 
                displayPhoto: pDoc.data().photoURL, 
                displayName: pDoc.data().name 
              };
            }
          } catch (err) { console.error("Error fetching product:", err); }
        }
        return { id: d.id, ...data };
      }));
      setGrants(list);
      setLoading(false);
    });

    return () => { unsubOrders(); unsubGrants(); };
  }, []);

  const handleAddComment = async (id, col) => {
    if (!commentText[id]?.trim()) return;
    try {
      await updateDoc(doc(db, col, id), {
        comments: arrayUnion({
          text: commentText[id].trim(),
          senderId: auth.currentUser.uid,
          senderRole: 'student',
          createdAt: new Date().toISOString()
        })
      });
      setCommentText({ ...commentText, [id]: "" });
    } catch (e) { console.error("Comment error:", e); }
  };

  if (loading) return <div className="loading-state">Loading My Activities...</div>;

  return (
    <div className="my-requests-container">
      <header className="main-header-web">
        <h1 className="main-title-web">My Activity</h1>
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>My Orders</button>
          <button className={`tab-btn ${activeTab === 'grants' ? 'active' : ''}`} onClick={() => setActiveTab('grants')}>My Grants</button>
        </div>
      </header>

      <div className="orders-list-wrapper">
        {(activeTab === 'orders' ? orders : grants).map(item => (
          <div key={item.id} className="order-card-web">
            
            {/* Left Section: Product Info (Horizontal Layout) */}
            <div className="order-info-section">
                <div className={`status-badge-web ${item.status}`}>
                    {item.status.replace('_', ' ')}
                </div>
                
                <img 
                  src={activeTab === 'orders' ? (item.items?.[0]?.photoURL) : (item.displayPhoto || item.productPhotoURL)} 
                  className="product-img-my" 
                  alt="Product" 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                />
                
                <div className="item-info-text">
                  <h4>{item.displayName || item.productName || (item.items?.[0]?.name) || "Product"}</h4>
                  {activeTab === 'orders' && <p className="price-tag">{item.totalPrice || item.price} EGP</p>}
                </div>
            </div>

            {/* Right Section: Chat Area */}
            <div className="chat-area-web">
               <div className="chat-title-web">Messages & Updates</div>
               <div className="messages-list-web">
                  {item.comments?.map((c, i) => (
                    <div key={i} className={`msg-bubble-web ${c.senderId === auth.currentUser.uid ? 'me' : 'other'}`}>
                       <span className="sender-name-web">
                         {c.senderId === auth.currentUser.uid 
                           ? "Me" 
                           : (c.senderRole === 'admin' 
                               ? "🛡️ Admin" 
                               : `👤 ${item.sellerName || item.items?.[0]?.sellerName || "Habiba"}`)
                         }
                       </span>
                       <p style={{margin: 0}}>{c.text}</p>
                    </div>
                  ))}
               </div>
               <div className="chat-input-web">
                  <input 
                    value={commentText[item.id] || ""} 
                    onChange={e => setCommentText({...commentText, [item.id]: e.target.value})} 
                    placeholder="Type a message..." 
                  />
                  <button onClick={() => handleAddComment(item.id, activeTab === 'orders' ? "orders" : "volunteer_requests")}>Send</button>
               </div>
            </div>

          </div>
        ))}

        {(activeTab === 'orders' ? orders : grants).length === 0 && (
          <div style={{textAlign: 'center', padding: '50px', color: '#64748B'}}>No requests found at the moment.</div>
        )}
      </div>
    </div>
  );
}

export default MyRequests;
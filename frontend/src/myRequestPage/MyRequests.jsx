import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './MyRequests.css';

function MyRequests() {
  const [orders, setOrders] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubOrders = onSnapshot(query(collection(db, "orders"), where("buyerId", "==", auth.currentUser.uid)), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubGrants = onSnapshot(query(collection(db, "volunteer_requests"), where("requesterId", "==", auth.currentUser.uid)), (snap) => {
      setGrants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => { unsubOrders(); unsubGrants(); };
  }, []);

  const handleAddComment = async (item, col) => {
    if (!commentText[item.id]?.trim()) return;
    try {
      await updateDoc(doc(db, col, item.id), {
        comments: arrayUnion({
          text: commentText[item.id].trim(),
          senderId: auth.currentUser.uid,
          senderRole: 'student',
          // الرد يروح للمرحلة الحالية للطلب
          stage: item.status === 'pending_admin' ? 'admin_review' : 'donor_delivery',
          createdAt: new Date().toISOString()
        })
      });
      setCommentText(prev => ({ ...prev, [item.id]: "" }));
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="loading-state">Loading...</div>;

  return (
    <div className="my-requests-container">
      <header className="main-header-web">
        <h1 className="main-title-web">Student Activity</h1>
        <div className="tabs-container">
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>Orders</button>
          <button className={activeTab === 'grants' ? 'active' : ''} onClick={() => setActiveTab('grants')}>Grants</button>
        </div>
      </header>

      <div className="orders-grid">
        {(activeTab === 'orders' ? orders : grants).map(item => (
          <div key={item.id} className="order-card-web">
            <div className={`status-bar ${item.status}`}><span>Status: {item.status}</span></div>
            <div className="item-row" style={{padding: '20px'}}><h4>{item.productName || "Product"}</h4></div>

            <div className="chat-area-web">
               <div className="messages-list-web">
                  {item.comments?.map((c, i) => (
                    <div key={i} className={`msg-bubble-web ${c.senderId === auth.currentUser.uid ? 'me' : 'other'}`}>
                       <span style={{fontSize: '10px', opacity: 0.7}}>
                         {c.senderRole === 'admin' ? 'Admin' : c.senderRole === 'seller' ? 'Provider' : 'Me'}
                       </span>
                       <p>{c.text}</p>
                    </div>
                  ))}
               </div>
               <div className="chat-input-web">
                  <input value={commentText[item.id] || ""} onChange={e => setCommentText({...commentText, [item.id]: e.target.value})} placeholder="Reply..." />
                  <button onClick={() => handleAddComment(item, activeTab === 'orders' ? "orders" : "volunteer_requests")}>Send</button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default MyRequests;
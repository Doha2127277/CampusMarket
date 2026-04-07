import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import './MyRequests.css';

function MyRequests() {
  const [orders, setOrders] = useState([]);
  const [sellersNames, setSellersNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, "orders"), where("buyerId", "==", auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const sortedData = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      const sellerIds = [...new Set(sortedData.map(order => order.sellerId))];
      const namesMap = {};
      await Promise.all(sellerIds.map(async (sId) => {
        if (!sId || sId === "unknown") return;
        const userDoc = await getDoc(doc(db, "users", sId));
        if (userDoc.exists()) {
          namesMap[sId] = userDoc.data().fullName || userDoc.data().name || "Seller";
        }
      }));

      setSellersNames(namesMap);
      setOrders(sortedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (orderId) => {
    const text = commentText[orderId];
    if (!text || text.trim() === "") return;

    try {
      const orderRef = doc(db, "orders", orderId);
      const newComment = {
        text: text.trim(),
        senderId: auth.currentUser.uid,
        senderRole: 'buyer',
        createdAt: new Date().toISOString()
      };

      await updateDoc(orderRef, {
        comments: arrayUnion(newComment)
      });

      setCommentText({ ...commentText, [orderId]: "" });
      fetchOrders(); 
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;

  return (
    <div className="my-requests-container">
      <header className="main-header-web">
        <h1 className="main-title-web">My Orders</h1>
      </header>

      <div className="orders-grid">
        {orders.length === 0 ? (
          <div className="no-orders">No orders yet.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card-web">
              
              {/* Header: Date & Status */}
              <div className={`status-bar ${order.status?.toLowerCase() || 'pending'}`}>
                <div className="header-left">
                   <span className="date-text">
                    {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : "Recently"}
                  </span>
                </div>
                <span className="status-label">{order.status || "Pending"}</span>
              </div>

              {/* Body: Products List */}
              <div className="order-items-list">
                {order.items?.map((item, index) => (
                  <div key={index} className="item-row">
                    <img src={item.photoURL} alt={item.name} className="prod-img-web" />
                    <div className="item-info">
                      <h4 className="prod-name-web">{item.name}</h4>
                      <p className="prod-price-web">{item.price} EGP</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Section: النسخة المطابقة للموبايل */}
              <div className="chat-area-web">
                <p className="chat-title-web">Chat with Seller</p>
                <div className="messages-list-web">
                  {order.comments && order.comments.length > 0 ? (
                    order.comments.map((msg, i) => (
                      <div key={i} className={`msg-bubble-web ${msg.senderId === auth.currentUser.uid ? 'me' : 'seller'}`}>
                        <small className="sender-name-web">
                          {msg.senderId === auth.currentUser.uid ? "Me" : (sellersNames[order.sellerId] || "Seller")}
                        </small>
                        <p className="msg-text-web">{msg.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-messages-web">No messages yet</p>
                  )}
                </div>
                <div className="chat-input-web">
                  <input 
                    type="text" 
                    placeholder="Write a message..." 
                    value={commentText[order.id] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [order.id]: e.target.value })}
                  />
                  <button className="send-btn-web" onClick={() => handleAddComment(order.id)}>
                    Send
                  </button>
                </div>
              </div>

              {/* Footer: Seller Name & Total Amount */}
              <div className="order-footer-web">
                <div className="seller-info-web">
                  <span className="seller-name-web-label">{sellersNames[order.sellerId] || order.sellerName || "Seller"}</span>
                </div>
                <span className="total-amount-web">{order.totalAmount} EGP</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyRequests;
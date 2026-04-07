import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './SellerRequests.css';

function SellerRequests() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, "orders"),
        where("sellerId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const sortedData = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(sortedData);
    } catch (error) {
      console.error("Error fetching seller orders: ", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      alert(`Order has been ${newStatus}`);
      fetchSellerOrders(); 
    } catch (error) {
      console.error("Error updating status:", error);
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
        senderRole: 'seller', 
        createdAt: new Date().toISOString()
      };

      await updateDoc(orderRef, {
        comments: arrayUnion(newComment)
      });

      setCommentText({ ...commentText, [orderId]: "" });
      fetchSellerOrders();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (loading) return <div className="loading-state">Loading Sales Data...</div>;

  return (
    <div className="seller-requests-container">
      <header className="seller-header-web">
        <h1 className="seller-title-web">Sales Manager</h1>
      </header>

      <div className="orders-grid-web">
        {orders.length === 0 ? (
          <div className="no-orders-web">No orders received yet.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="seller-horizontal-card">
              
              <div className="order-info-section">
                <div className={`status-badge-web ${order.status?.toLowerCase() || 'pending'}`}>
                  {order.status || "Pending"}
                </div>
                
                <p className="buyer-name-web">Buyer: {order.buyerName || "Student"}</p>
                <p className="order-date-web">
                  {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : "Recently"}
                </p>

                <div className="products-mini-list">
                  {order.items?.map((prod, index) => (
                    <div key={index} className="product-row-web">
                      {/* تعديل سطر الصورة لضمان القراءة الصحيحة */}
                      <img 
                        src={prod.photoURL || prod.image || prod.imageUrl || "https://via.placeholder.com/150?text=No+Image"} 
                        alt={prod.name} 
                        className="mini-prod-img" 
                        onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error"; }}
                      />
                      <div className="mini-prod-info">
                        <span className="mini-name">{prod.name}</span>
                        <span className="mini-price">{prod.price} EGP</span>
                      </div>
                    </div>
                  ))}
                </div>

                {(!order.status || order.status === "pending") && (
                  <div className="seller-actions">
                    <button className="approve-btn-web" onClick={() => updateOrderStatus(order.id, "approved")}>Approve</button>
                    <button className="reject-btn-web" onClick={() => updateOrderStatus(order.id, "rejected")}>Reject</button>
                  </div>
                )}

                <div className="income-footer">
                  <span>Total Income:</span>
                  <strong>{order.totalAmount} EGP</strong>
                </div>
              </div>

              <div className="seller-chat-section">
                <p className="chat-label-web">Chat with Buyer</p>
                <div className="chat-messages-web">
                  {order.comments?.map((c, i) => (
                    <div key={i} className={`bubble-web ${c.senderId === auth.currentUser.uid ? 'me' : 'buyer'}`}>
                      <small>{c.senderId === auth.currentUser.uid ? "Me (Seller)" : "Buyer"}</small>
                      <p>{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="chat-input-row">
                  <input 
                    type="text" 
                    placeholder="Reply to buyer..." 
                    value={commentText[order.id] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [order.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(order.id)}
                  />
                  <button onClick={() => handleAddComment(order.id)}>Send</button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SellerRequests;
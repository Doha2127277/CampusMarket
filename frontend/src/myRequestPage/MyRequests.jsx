import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc, increment } from 'firebase/firestore';
import './MyRequests.css';

function MyRequests() {
  const [orders, setOrders] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [commentText, setCommentText] = useState({});

  // --- حالات مودال التقييم ---
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubOrders = onSnapshot(query(collection(db, "orders"), where("buyerId", "==", auth.currentUser.uid)), async (snap) => {
      const list = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data();
        const sellerId = data.sellerId || data.items?.[0]?.sellerId;
        let rating = 5;
        let reviews = 0;

        if (sellerId) {
          const sDoc = await getDoc(doc(db, "users", sellerId));
          if (sDoc.exists()) {
            rating = sDoc.data().rating || 5;
            reviews = sDoc.data().totalReviews || 0;
          }
        }
        return { id: d.id, ...data, sellerRating: rating, totalReviews: reviews, type: 'order' };
      }));
      setOrders(list);
    });

    const unsubGrants = onSnapshot(query(collection(db, "volunteer_requests"), where("requesterId", "==", auth.currentUser.uid)), async (snapshot) => {
      const list = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        let rating = 5;
        let reviews = 0;
        let displayPhoto = data.productPhotoURL;
        let displayName = data.productName;
        let sellerIdFromProduct = data.sellerId;

        if (data.productId) {
          try {
            const pDoc = await getDoc(doc(db, "products", data.productId));
            if (pDoc.exists()) {
              displayPhoto = pDoc.data().photoURL;
              displayName = pDoc.data().name;
              sellerIdFromProduct = pDoc.data().userId || pDoc.data().sellerId;
              
              if (sellerIdFromProduct) {
                const sDoc = await getDoc(doc(db, "users", sellerIdFromProduct));
                if (sDoc.exists()) {
                  rating = sDoc.data().rating || 5;
                  reviews = sDoc.data().totalReviews || 0;
                }
              }
            }
          } catch (err) { console.error("Error fetching data:", err); }
        }
        return { 
          id: d.id, 
          ...data, 
          sellerId: sellerIdFromProduct,
          displayPhoto, 
          displayName, 
          sellerRating: rating, 
          totalReviews: reviews,
          type: 'grant'
        };
      }));
      setGrants(list);
      setLoading(false);
    });

    return () => { unsubOrders(); unsubGrants(); };
  }, []);

  // --- دالة إنهاء العملية والتقييم ---
  const handleFinalize = async () => {
    if (ratingValue === 0) { alert("Please select a rating!"); return; }
    setIsFinishing(true);

    try {
      const { productId, sellerId, id, type } = selectedItem;
      const collectionName = type === 'order' ? "orders" : "volunteer_requests";

      // 1. تحديث حالة المنتج ليكون مباع (ليختفي من الـ Home)
      if (productId) {
        await updateDoc(doc(db, "products", productId), { isSold: true });
      }

      // 2. تحديث حالة الطلب ليكون مكتمل
      await updateDoc(doc(db, collectionName, id), { status: 'completed' });

      // 3. تحديث تقييم البائع
      const sellerRef = doc(db, "users", sellerId);
      const sellerSnap = await getDoc(sellerRef);
      
      if (sellerSnap.exists()) {
        const data = sellerSnap.data();
        const oldReviews = data.totalReviews || 0;
        const oldRating = data.rating || 5;
        const newTotalReviews = oldReviews + 1;
        const newRating = ((oldRating * oldReviews) + ratingValue) / newTotalReviews;

        await updateDoc(sellerRef, {
          rating: newRating,
          totalReviews: newTotalReviews
        });
      }

      setShowRatingModal(false);
      setRatingValue(0);
      alert("Transaction completed successfully!");
    } catch (error) {
      console.error("Error finalizing:", error);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleAddComment = async (item, col) => {
    const text = commentText[item.id]?.trim();
    if (!text) return;
    let currentStage = 'direct_sales'; 
    if (col === "volunteer_requests") {
        currentStage = item.status === 'pending_admin' ? 'admin_review' : 'donor_contact';
    }
    try {
      await updateDoc(doc(db, col, item.id), {
        comments: arrayUnion({
          text: text,
          senderId: auth.currentUser.uid,
          senderRole: 'student',
          stage: currentStage,
          createdAt: new Date().toISOString()
        })
      });
      setCommentText({ ...commentText, [item.id]: "" });
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
            <div className="order-info-section">
                <div className={`status-badge-web ${item.status}`}>
                    {item.status ? item.status.replace(/_/g, ' ') : 'Pending'}
                </div>
                
                <img 
                  src={activeTab === 'orders' ? (item.items?.[0]?.photoURL) : (item.displayPhoto)} 
                  className="product-img-my" 
                  alt="Product" 
                />
                
                <div className="item-info-text">
                  <h4>{item.displayName || item.productName || (item.items?.[0]?.name) || "Product"}</h4>
                  <div style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '5px' }}>
                      ⭐ {item.sellerRating?.toFixed(1) || "5.0"} 
                      <span style={{ color: '#888', marginLeft: '4px' }}>({item.totalReviews || 0})</span>
                  </div>
                  
                  {/* --- زر التأكيد والتقييم --- */}
                  {item.status !== 'completed' && (
                    <button 
                      className="confirm-btn-web"
                      onClick={() => { setSelectedItem(item); setShowRatingModal(true); }}
                    >
                      Confirm Received & Rate
                    </button>
                  )}
                </div>
            </div>

            <div className="chat-area-web">
                {/* ... (نفس كود الشات الخاص بك بدون تغيير) ... */}
                <div className="chat-title-web">
                    {activeTab === 'orders' ? "Chat with Seller" : 
                     (item.status === 'pending_admin' ? "🛡️ Chat with Admin" : "👤 Chat with Donor")}
                </div>
                <div className="messages-list-web">
                  {item.comments?.filter(c => {
                      if (activeTab === 'grants') {
                          const targetStage = item.status === 'pending_admin' ? 'admin_review' : 'donor_contact';
                          return c.stage === targetStage;
                      }
                      return true; 
                  }).map((c, i) => (
                    <div key={i} className={`msg-bubble-web ${c.senderId === auth.currentUser.uid ? 'me' : 'other'}`}>
                       <span className="sender-name-web">
                         {c.senderId === auth.currentUser.uid ? "Me" : (c.senderRole === 'admin' ? "🛡️ Admin" : "Provider")}
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
                  <button onClick={() => handleAddComment(item, activeTab === 'orders' ? "orders" : "volunteer_requests")}>Send</button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Rating Modal --- */}
      {showRatingModal && (
        <div className="modal-overlay">
          <div className="rating-card">
            <h3>Rate Your Experience</h3>
            <p>How was the provider and the product?</p>
            <div className="stars-row">
              {[1, 2, 3, 4, 5].map(num => (
                <span 
                  key={num} 
                  className={`star ${num <= ratingValue ? 'filled' : ''}`}
                  onClick={() => setRatingValue(num)}
                >
                  ⭐
                </span>
              ))}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowRatingModal(false)}>Cancel</button>
              <button className="submit-btn" disabled={isFinishing} onClick={handleFinalize}>
                {isFinishing ? "Processing..." : "Confirm & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyRequests;

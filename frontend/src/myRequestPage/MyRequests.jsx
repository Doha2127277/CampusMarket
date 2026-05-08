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

    // Fetch Commercial Orders + Seller Rating
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
        return { id: d.id, ...data, sellerRating: rating, totalReviews: reviews };
      }));
      setOrders(list);
    });

    // Fetch Volunteer/Grant Requests + Seller Rating
    const unsubGrants = onSnapshot(query(collection(db, "volunteer_requests"), where("requesterId", "==", auth.currentUser.uid)), async (snapshot) => {
      const list = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        let rating = 5;
        let reviews = 0;
        let displayPhoto = data.productPhotoURL;
        let displayName = data.productName;

        if (data.productId) {
          try {
            const pDoc = await getDoc(doc(db, "products", data.productId));
            if (pDoc.exists()) {
              displayPhoto = pDoc.data().photoURL;
              displayName = pDoc.data().name;
              const sellerId = pDoc.data().userId || pDoc.data().sellerId;
              
              if (sellerId) {
                const sDoc = await getDoc(doc(db, "users", sellerId));
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
          displayPhoto, 
          displayName, 
          sellerRating: rating, 
          totalReviews: reviews 
        };
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
            
            {/* Left Section: Product Info */}
            <div className="order-info-section">
                <div className={`status-badge-web ${item.status}`}>
                    {item.status ? item.status.replace('_', ' ') : 'Pending'}
                </div>
                
                <img 
                  src={activeTab === 'orders' ? (item.items?.[0]?.photoURL) : (item.displayPhoto)} 
                  className="product-img-my" 
                  alt="Product" 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                />
                
                <div className="item-info-text">
                  <h4>{item.displayName || item.productName || (item.items?.[0]?.name) || "Product"}</h4>
                  
                  <div style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '5px' }}>
                      ⭐ {item.sellerRating?.toFixed(1) || "5.0"} 
                      <span style={{ color: '#888', marginLeft: '4px' }}>({item.totalReviews || 0})</span>
                  </div>

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
                               : `👤 ${item.sellerName || item.items?.[0]?.sellerName || "Seller"}`)
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

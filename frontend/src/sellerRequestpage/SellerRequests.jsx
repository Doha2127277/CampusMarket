import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import './SellerRequests.css';

function SellerRequests() {
    const [orders, setOrders] = useState([]);
    const [donations, setDonations] = useState([]);
    const [activeTab, setActiveTab] = useState('sales');
    const [commentText, setCommentText] = useState({});

    useEffect(() => {
        if (!auth.currentUser) return;
        
        const unsubOrders = onSnapshot(query(collection(db, "orders"), where("sellerId", "==", auth.currentUser.uid)), (snap) => {
            setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubDonations = onSnapshot(query(collection(db, "volunteer_requests"), where("sellerId", "==", auth.currentUser.uid), where("status", "in", ["approved", "rejected"])), async (snapshot) => {
            const list = await Promise.all(snapshot.docs.map(async (d) => {
                const data = d.data();
                if (data.productId) {
                    const pDoc = await getDoc(doc(db, "products", data.productId));
                    return { id: d.id, ...data, displayPhoto: pDoc.exists() ? pDoc.data().photoURL : null };
                }
                return { id: d.id, ...data };
            }));
            setDonations(list);
        });
        return () => { unsubOrders(); unsubDonations(); };
    }, []);

    const handleAddComment = async (id, col) => {
        if (!commentText[id]?.trim()) return;
        await updateDoc(doc(db, col, id), {
            comments: arrayUnion({
                text: commentText[id],
                senderId: auth.currentUser.uid,
                senderRole: 'seller',
                createdAt: new Date().toISOString()
            })
        });
        setCommentText({ ...commentText, [id]: "" });
    };

    return (
        <div className="seller-requests-container">
            <header className="seller-header-web">
                <h1 className="seller-title-web">Provider Dashboard</h1>
                <div className="admin-tabs">
                    <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>Sales</button>
                    <button className={activeTab === 'donations' ? 'active' : ''} onClick={() => setActiveTab('donations')}>Donations</button>
                </div>
            </header>
            <div className="orders-grid-web">
                {(activeTab === 'sales' ? orders : donations).map((item) => (
                    <div key={item.id} className="seller-horizontal-card">
                        <div className="order-info-section">
                            <div className={`status-badge-web ${item.status}`}>{item.status}</div>
                            <img src={activeTab === 'sales' ? (item.items?.[0]?.photoURL) : (item.displayPhoto || item.productPhotoURL)} className="product-img-seller" alt="" />
                            <p className="buyer-name-web">{activeTab === 'sales' ? item.buyerName : item.requesterName}</p>
                        </div>
                        <div className="chat-area-web">
                            <div className="messages-list-web">
                                {item.comments?.filter(c => c.stage !== 'admin_review').map((c, i) => (
                                    <div key={i} className={`msg-bubble-web ${c.senderId === auth.currentUser.uid ? 'me' : 'other'}`}>
                                        <span className="sender-name-web">
                                            {c.senderId === auth.currentUser.uid 
                                              ? "Me" 
                                              : (c.senderRole === 'admin' ? "🛡️ Admin" : `🎓 ${item.buyerName || item.requesterName || "Student"}`)
                                            }
                                        </span>
                                        <p style={{margin: 0}}>{c.text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="chat-input-web">
                                <input value={commentText[item.id] || ""} onChange={(e) => setCommentText({...commentText, [item.id]: e.target.value})} placeholder="Reply..." />
                                <button className="send-btn-web" onClick={() => handleAddComment(item.id, activeTab === 'sales' ? "orders" : "volunteer_requests")}>Send</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default SellerRequests;
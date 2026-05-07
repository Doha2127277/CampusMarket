import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './SellerRequests.css';

function SellerRequests() {
    const [orders, setOrders] = useState([]);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState({});
    const [activeTab, setActiveTab] = useState('sales');

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsubOrders = onSnapshot(query(collection(db, "orders"), where("sellerId", "==", auth.currentUser.uid)), (snap) => {
            setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubDonations = onSnapshot(query(collection(db, "volunteer_requests"), where("sellerId", "==", auth.currentUser.uid), where("status", "in", ["approved", "rejected"])), (snap) => {
            setDonations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => { unsubOrders(); unsubDonations(); };
    }, []);

    const handleAddComment = async (id, collectionName) => {
        if (!commentText[id]?.trim()) return;
        try {
            await updateDoc(doc(db, collectionName, id), {
                comments: arrayUnion({
                    text: commentText[id].trim(),
                    senderId: auth.currentUser.uid,
                    senderRole: 'seller',
                    stage: collectionName === 'volunteer_requests' ? 'donor_delivery' : 'sales',
                    createdAt: new Date().toISOString()
                })
            });
            setCommentText(prev => ({ ...prev, [id]: "" }));
        } catch (error) { console.error(error); }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="seller-requests-container">
            <header className="seller-header-web">
                <h1>Provider Dashboard</h1>
                <div className="admin-tabs">
                    <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>Commercial Sales</button>
                    <button className={activeTab === 'donations' ? 'active' : ''} onClick={() => setActiveTab('donations')}>Donations</button>
                </div>
            </header>

            <div className="orders-grid-web">
                {(activeTab === 'sales' ? orders : donations).map((item) => (
                    <div key={item.id} className="seller-horizontal-card">
                        <div className="order-info-section">
                            <div className={`status-badge-web ${item.status}`}>{item.status}</div>
                            <p className="buyer-name-web">
                                {activeTab === 'sales' ? `Buyer: ${item.buyerName}` : `Requester: ${item.requesterName}`}
                            </p>
                            {activeTab === 'donations' ? (
                                <div className="donation-verified-msg">
                                    <h3 className="donation-title">Item: {item.productName}</h3>
                                    <p style={{color: '#059669', fontSize: '0.9rem'}}>✓ Verified by Admin</p>
                                </div>
                            ) : null}
                            
                            {/* أزرار الموافقة تظهر فقط في البيع العادي */}
                            {activeTab === 'sales' && item.status === 'pending' && (
                                <div className="seller-actions">
                                    <button className="approve-btn-web" onClick={() => updateDoc(doc(db,"orders",item.id),{status:"approved"})}>Approve</button>
                                </div>
                            )}
                        </div>

                        <div className="chat-area-web">
                            <div className="messages-list-web">
                                {item.comments?.filter(c => c.stage !== 'admin_review').map((c, i) => (
                                    <div key={i} className={`msg-bubble-web ${c.senderId === auth.currentUser.uid ? 'me' : 'student'}`}>
                                        <span className="sender-name-web" style={{fontSize: '11px', fontWeight: 'bold', display: 'block'}}>
                                            {c.senderId === auth.currentUser.uid ? "Me" : (item.requesterName || "Student")}
                                        </span>
                                        <p>{c.text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="chat-input-web">
                                <input placeholder="Reply..." value={commentText[item.id] || ""} onChange={(e) => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))} />
                                <button onClick={() => handleAddComment(item.id, activeTab === 'sales' ? "orders" : "volunteer_requests")}>Send</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default SellerRequests;
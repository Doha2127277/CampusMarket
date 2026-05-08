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

        // جلب طلبات الشراء
        
        const unsubOrders = onSnapshot(query(collection(db, "orders"), where("sellerId", "==", auth.currentUser.uid)), (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Full Orders Data:", data); // عشان تشوف البيانات في الـ Console
            setOrders(data);
        });

        // جلب طلبات التبرع
        const unsubDonations = onSnapshot(query(collection(db, "volunteer_requests"), where("sellerId", "==", auth.currentUser.uid), where("status", "in", ["approved", "rejected"])), (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDonations(data);
            setLoading(false);
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

    // دالة ذكية لاستخراج الصورة والاسم مهما كان مكانهم في الـ Database
    const getProductInfo = (item) => {
        // فحص لو البيانات جوه مصفوفة items (زي الـ Orders) أو مباشرة في الكارت
        const firstItem = (item.items && item.items.length > 0) ? item.items[0] : {};
        
        // تجميع كل البيانات المتاحة للبحث فيها
        const combinedData = { ...item, ...firstItem };

        // البحث التلقائي عن أي حقل يحتوي على رابط (URL) يبدأ بـ http
        const detectedImage = Object.values(combinedData).find(
            val => typeof val === 'string' && (val.startsWith('http') || val.startsWith('https'))
        );

        return {
            image: detectedImage || null,
            name: item.productName || item.name || firstItem.productName || firstItem.name || "Product"
        };
    };

    if (loading) return <div className="loading">Loading...</div>;

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
                {(activeTab === 'sales' ? orders : donations).map((item) => {
                    const product = getProductInfo(item);
                    
                    return (
                        <div key={item.id} className="seller-horizontal-card" style={{ 
                            display: 'flex', 
                            flexDirection: 'row', 
                            background: '#fff',
                            marginBottom: '20px',
                            borderRadius: '15px',
                            border: '1px solid #eee',
                            minHeight: '200px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                        }}>
                            
                            {/* 1. قسم الصورة على اليسار */}
                            <div style={{ 
                                width: '200px', 
                                minWidth: '200px',
                                backgroundColor: '#f9f9f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRight: '1px solid #eee'
                            }}>
                                {product.image ? (
                                    <img 
                                        src={product.image} 
                                        alt="product" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#ccc' }}>
                                        <p style={{ fontSize: '12px' }}>No Image Found</p>
                                    </div>
                                )}
                            </div>

                            {/* 2. قسم معلومات الطلب في المنتصف */}
                            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                                <div className={`status-badge-web ${item.status}`} style={{ width: 'fit-content' }}>{item.status}</div>
                                <h3 style={{ margin: '15px 0 5px 0', color: '#1a1a1a' }}>{product.name}</h3>
                                <p style={{ margin: 0, fontWeight: '600', color: '#555' }}>
                                    {activeTab === 'sales' ? `Buyer: ${item.buyerName || 'Student'}` : `Requester: ${item.requesterName}`}
                                </p>
                                
                                {activeTab === 'sales' && item.status === 'pending' && (
                                    <div style={{ marginTop: 'auto' }}>
                                        <button className="approve-btn-web" onClick={() => updateDoc(doc(db,"orders",item.id),{status:"approved"})}>
                                            Approve Request
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 3. قسم الشات على اليمين */}
                            <div style={{ flex: 1.2, padding: '15px', borderLeft: '1px solid #eee', display: 'flex', flexDirection: 'column', backgroundColor: '#fcfcfc' }}>
                                <div className="messages-list-web" style={{ flex: 1, maxHeight: '120px', overflowY: 'auto' }}>
                                    {item.comments?.filter(c => c.stage !== 'admin_review').map((c, i) => (
                                        <div key={i} className={`msg-bubble-web ${c.senderId === auth.currentUser.uid ? 'me' : 'student'}`}>
                                            <p style={{ margin: 0, fontSize: '13px' }}>{c.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="chat-input-web" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <input 
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '14px' }}
                                        placeholder="Type a message..." 
                                        value={commentText[item.id] || ""} 
                                        onChange={(e) => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))} 
                                    />
                                    <button style={{ borderRadius: '20px', padding: '8px 15px' }} onClick={() => handleAddComment(item.id, activeTab === 'sales' ? "orders" : "volunteer_requests")}>
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SellerRequests;
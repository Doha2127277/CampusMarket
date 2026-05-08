import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    doc, 
    updateDoc, 
    arrayUnion, 
    getDoc 
} from 'firebase/firestore';
import './SellerRequests.css';

function SellerRequests() {
    const [orders, setOrders] = useState([]);
    const [donations, setDonations] = useState([]);
    const [activeTab, setActiveTab] = useState('sales');
    const [commentText, setCommentText] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;

        // 1. جلب طلبات الشراء (المبيعات)
        const unsubOrders = onSnapshot(query(
            collection(db, "orders"), 
            where("sellerId", "==", auth.currentUser.uid)
        ), (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(data);
        });

        // 2. جلب طلبات التبرع مع جلب الصورة يدوياً من كوليكشن المنتجات
        const unsubDonations = onSnapshot(query(
            collection(db, "volunteer_requests"), 
            where("sellerId", "==", auth.currentUser.uid), 
            where("status", "in", ["approved_by_admin", "approved_by_donor", "approved", "rejected"])
        ), async (snap) => {
            const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const updatedDocs = await Promise.all(docs.map(async (item) => {
                // لو الصورة مش موجودة جوه الطلب، بنروح نجيبها من جدول المنتجات الأصلي
                if (!item.productPhotoURL && item.productId) {
                    try {
                        const productRef = doc(db, "products", item.productId);
                        const productSnap = await getDoc(productRef);
                        if (productSnap.exists()) {
                            const pData = productSnap.data();
                            console.log("Found Photo for:", item.productName, pData.photoURL); // للتأكد في الـ console
                            return { ...item, productPhotoURL: pData.photoURL || pData.image };
                        }
                    } catch (err) {
                        console.error("Error fetching photo from products:", err);
                    }
                }
                return item;
            }));
            
            setDonations(updatedDocs);
            setLoading(false);
        });

        return () => { unsubOrders(); unsubDonations(); };
    }, []);

    const handleAddComment = async (id, col) => {
        if (!commentText[id]?.trim()) return;
        const stage = col === "volunteer_requests" ? 'donor_contact' : 'direct_sales';

        await updateDoc(doc(db, col, id), {
            comments: arrayUnion({
                text: commentText[id],
                senderId: auth.currentUser.uid,
                senderRole: 'seller',
                stage: stage,
                createdAt: new Date().toISOString()
            })
        });
        setCommentText({ ...commentText, [id]: "" });
    };

    const handleDonorApprove = async (reqId) => {
        if (window.confirm("هل أنت موافق على إعطاء هذا المنتج لهذا الطالب؟")) {
            try {
                await updateDoc(doc(db, "volunteer_requests", reqId), {
                    status: "approved_by_donor",
                    donorApproved: true,
                    updatedAt: new Date().toISOString()
                });
            } catch (e) { console.error("Approve Error:", e); }
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    return (
        <div className="seller-requests-container">
            <header className="seller-header-web">
                <h1 className="seller-title-web">Provider Dashboard</h1>
                <div className="admin-tabs">
                    <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>Commercial Sales</button>
                    <button className={activeTab === 'donations' ? 'active' : ''} onClick={() => setActiveTab('donations')}>Donations</button>
                </div>
            </header>

            <div className="orders-grid-web">
                {(activeTab === 'sales' ? orders : donations).map((item) => {
                    // تحديد الصورة النهائية: إما من الطلب أو من الداتا اللي جبناها من الـ products
                    const finalImage = item.productPhotoURL || item.photoURL || (item.items && item.items[0]?.photoURL);

                    return (
                        <div key={item.id} className="seller-horizontal-card" style={{ 
                            display: 'flex', flexDirection: 'row', background: '#fff', marginBottom: '20px',
                            borderRadius: '15px', border: '1px solid #eee', minHeight: '200px',
                            overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                        }}>
                            
                            {/* مربع الصورة */}
                            <div style={{ width: '200px', minWidth: '200px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #eee' }}>
                                {finalImage ? (
                                    <img 
                                        src={finalImage} 
                                        alt="product" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        onError={(e) => { 
                                            console.log("Image load failed, trying placeholder");
                                            e.target.src = 'https://via.placeholder.com/200?text=Image+Not+Available'; 
                                        }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#ccc' }}>
                                        <p style={{ fontSize: '12px' }}>No Image Found</p>
                                    </div>
                                )}
                            </div>

                            {/* معلومات الطلب */}
                            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                                <div className={`status-badge-web ${item.status}`} style={{ width: 'fit-content' }}>{item.status}</div>
                                <h3 style={{ margin: '15px 0 5px 0', color: '#1a1a1a' }}>{item.productName || "Product"}</h3>
                                <p style={{ margin: 0, fontWeight: '600', color: '#555' }}>
                                    {activeTab === 'sales' ? `Buyer: ${item.buyerName || 'Student'}` : `Requester: ${item.requesterName || 'Student'}`}
                                </p>
                                
                                <div style={{ marginTop: 'auto' }}>
                                    {activeTab === 'donations' && item.status === 'approved_by_admin' && (
                                        <button className="approve-btn-web" style={{ backgroundColor: '#10b981' }} onClick={() => handleDonorApprove(item.id)}>
                                            Confirm Giving
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* شات المتبرع مع الطالب */}
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
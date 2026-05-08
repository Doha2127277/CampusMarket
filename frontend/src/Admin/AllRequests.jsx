import React, { useEffect, useState } from 'react';
import { db, auth } from "../firebase";
import { collection, onSnapshot, updateDoc, doc, getDoc, arrayUnion } from "firebase/firestore";
import './AllRequests.css';

const AllRequests = () => {
    const [products, setProducts] = useState([]); 
    const [volunteerRequests, setVolunteerRequests] = useState([]); 
    const [isAdmin, setIsAdmin] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [activeTab, setActiveTab] = useState('products'); 
    const [commentText, setCommentText] = useState({});

    useEffect(() => {
        const checkAdmin = async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().role === "admin") {
                        setIsAdmin(true);
                    }
                } catch (e) { console.error("Admin Check Error:", e); }
            }
            setVerifying(false);
        };
        const unsubAuth = auth.onAuthStateChanged(checkAdmin);

        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(list.filter(p => p.status === "pending"));
        });

        const unsubVolunteer = onSnapshot(collection(db, "volunteer_requests"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // بنعرض الطلبات اللي حالتها لسه تحت مراجعة الأدمن فقط
            setVolunteerRequests(list.filter(req => req.status === "pending_admin"));
        });

        return () => { unsubAuth(); unsubProducts(); unsubVolunteer(); };
    }, []);

    const handleAdminChat = async (reqId) => {
        if (!commentText[reqId]?.trim()) return;
        try {
            await updateDoc(doc(db, "volunteer_requests", reqId), {
                comments: arrayUnion({
                    text: commentText[reqId].trim(),
                    senderId: auth.currentUser.uid,
                    senderRole: 'admin',
                    stage: 'admin_review', // تحديد أن هذه الرسالة تابعة لمرحلة الأدمن
                    createdAt: new Date().toISOString()
                })
            });
            setCommentText({ ...commentText, [reqId]: "" });
        } catch (e) { console.error("Chat Error:", e); }
    };

    // تعديل دالة الموافقة لنقل الطلب للمرحلة التالية (المتبرع)
    const handleApproveByAdmin = async (reqId) => {
        if (window.confirm("Approve this request to move to donor contact?")) {
            try {
                await updateDoc(doc(db, "volunteer_requests", reqId), {
                    status: "approved_by_admin", // الحالة الجديدة
                    adminApproved: true,
                    updatedAt: new Date().toISOString()
                });
                // الطلب سيختفي تلقائياً من صفحة الأدمن بسبب الـ filter في الـ useEffect
            } catch (e) { console.error("Approve Error:", e); }
        }
    };

    const handleRejectVolunteer = async (reqId) => {
        if (window.confirm("Are you sure you want to reject this request?")) {
            try {
                await updateDoc(doc(db, "volunteer_requests", reqId), {
                    status: "rejected"
                });
            } catch (e) { console.error("Reject Error:", e); }
        }
    };

    if (verifying) return <div className="admin-container"><h2>Verifying Access...</h2></div>;
    if (!isAdmin) return <div className="admin-container"><h2 style={{color:'red', textAlign:'center'}}>Access Denied</h2></div>;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="admin-tabs-container">
                    <button className={`admin-tab-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                        <span className="tab-label">📦 New Products</span>
                        <span className="tab-badge">{products.length}</span>
                    </button>
                    <button className={`admin-tab-item ${activeTab === 'volunteer' ? 'active' : ''}`} onClick={() => setActiveTab('volunteer')}>
                        <span className="tab-label">🤝 Volunteer Requests</span>
                        <span className="tab-badge">{volunteerRequests.length}</span>
                    </button>
                </div>
            </header>

            <div className="requests-content">
                {activeTab === 'products' ? (
                    <div className="list-container">
                        {products.map(p => (
                            <div key={p.id} className="request-card-admin">
                                <div className="request-row">
                                    <img src={p.photoURL} className="product-img-admin" alt="" />
                                    <div className="request-info">
                                        <div className="product-name">{p.name}</div>
                                        <div className="info-group"><span>Price:</span> {p.price} EGP</div>
                                    </div>
                                    <button className="btn-approve" onClick={() => updateDoc(doc(db, "products", p.id), {status: "approved"})}>Approve</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="list-container">
                        {volunteerRequests.map(req => (
                            <div key={req.id} className="request-card-admin">
                                <div className="request-row">
                                    <div className="request-info">
                                        <div className="product-name">Item: {req.productName}</div>
                                        <div className="info-group"><span>Requester:</span> {req.requesterName}</div>
                                    </div>
                                    <div className="admin-actions">
                                        <button className="btn-approve" onClick={() => handleApproveByAdmin(req.id)}>Approve</button>
                                        <button className="btn-reject" onClick={() => handleRejectVolunteer(req.id)}>Reject</button>
                                    </div>
                                </div>

                                <div className="admin-chat-box">
                                    <div className="messages-list-web">
                                        {/* عرض رسائل مرحلة مراجعة الأدمن فقط */}
                                        {req.comments?.filter(c => c.stage === 'admin_review').map((c, i) => (
                                            <div key={i} className={`msg-bubble-web ${c.senderRole === 'admin' ? 'me' : 'student'}`}>
                                                <span className="sender-name-web">{c.senderRole === 'admin' ? "Admin" : (req.requesterName || "Student")}</span>
                                                <p>{c.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="chat-input-web">
                                        <input 
                                            type="text" 
                                            placeholder="Message student..." 
                                            value={commentText[req.id] || ""} 
                                            onChange={(e) => setCommentText({...commentText, [req.id]: e.target.value})} 
                                        />
                                        <button className="send-btn-web" onClick={() => handleAdminChat(req.id)}>Send</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {volunteerRequests.length === 0 && <p className="empty-msg">No volunteer requests to show.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllRequests;

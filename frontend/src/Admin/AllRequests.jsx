import React, { useEffect, useState } from 'react';
import { db, auth } from "../firebase";
import { collection, onSnapshot, updateDoc, doc, getDoc, arrayUnion, query, where, deleteDoc } from "firebase/firestore";
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

        // 1. Fetch Pending Products
        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(list.filter(p => p.status === "pending"));
        });

        // 2. Fetch Volunteer Requests
        const unsubVolunteer = onSnapshot(query(collection(db, "volunteer_requests"), where("status", "==", "pending_admin")), async (snapshot) => {
            const requestsWithDetails = await Promise.all(snapshot.docs.map(async (requestDoc) => {
                const reqData = requestDoc.data();
                if (reqData.productId) {
                    const productDoc = await getDoc(doc(db, "products", reqData.productId));
                    if (productDoc.exists()) {
                        const productData = productDoc.data();
                        return { 
                            id: requestDoc.id, 
                            ...reqData, 
                            displayPhoto: productData.photoURL,
                            displayName: productData.name
                        };
                    }
                }
                return { id: requestDoc.id, ...reqData };
            }));
            setVolunteerRequests(requestsWithDetails);
        });

        return () => { unsubAuth(); unsubProducts(); unsubVolunteer(); };
    }, []);

    // Function to send comments for both Products and Volunteer Requests
    const handleAdminChat = async (id, collectionName) => {
        if (!commentText[id]?.trim()) return;
        try {
            await updateDoc(doc(db, collectionName, id), {
                comments: arrayUnion({
                    text: commentText[id].trim(),
                    senderId: auth.currentUser.uid,
                    senderRole: 'admin',
                    stage: 'admin_review',
                    createdAt: new Date().toISOString()
                })
            });
            setCommentText({ ...commentText, [id]: "" });
        } catch (e) { console.error("Chat Error:", e); }
    };

    if (verifying) return <div className="admin-container"><h2>Verifying Admin Status...</h2></div>;
    if (!isAdmin) return <div className="admin-container"><h2 style={{color:'red', textAlign:'center'}}>Access Denied</h2></div>;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Admin Control Panel</h1>
                <div className="admin-tabs-container">
                    <button className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                        New Products ({products.length})
                    </button>
                    <button className={`admin-tab ${activeTab === 'volunteer' ? 'active' : ''}`} onClick={() => setActiveTab('volunteer')}>
                        Volunteer Requests ({volunteerRequests.length})
                    </button>
                </div>
            </header>

            <div className="requests-list">
                {activeTab === 'products' ? (
                    products.map(p => (
                        <div key={p.id} className="request-card-admin">
                            <div className="request-main-row">
                                <img src={p.photoURL} className="product-img-admin" alt="Product" />
                                <div className="request-info">
                                    <div className="product-name">{p.name}</div>
                                    <div className="info-group"><span>Price:</span> {p.price} EGP</div>
                                    <div className="info-group"><span>Seller:</span> {p.sellerName || "User"}</div>
                                </div>
                                <div className="admin-action-buttons">
                                    <button className="btn-approve" onClick={() => updateDoc(doc(db, "products", p.id), {status: "approved"})}>Approve</button>
                                    <button className="btn-reject" onClick={() => updateDoc(doc(db, "products", p.id), {status: "rejected"})}>Reject</button>
                                </div>
                            </div>
                            
                            {/* Chat Box for Products */}
                            <div className="admin-chat-box">
                                <div className="messages-list-web">
                                    {p.comments?.map((c, i) => (
                                        <div key={i} className={`msg-bubble-web ${c.senderRole === 'admin' ? 'me' : 'other'}`}>
                                            <span className="sender-name-web">{c.senderRole === 'admin' ? "Admin" : "Seller"}</span>
                                            <p>{c.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="chat-input-web">
                                    <input type="text" placeholder="Add a note to seller..." value={commentText[p.id] || ""} onChange={(e) => setCommentText({...commentText, [p.id]: e.target.value})} />
                                    <button onClick={() => handleAdminChat(p.id, "products")}>Send</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    volunteerRequests.map(req => (
                        <div key={req.id} className="request-card-admin">
                            <div className="request-main-row">
                                <img src={req.displayPhoto || req.productPhotoURL} className="product-img-admin" alt="Item" />
                                <div className="request-info">
                                    <div className="product-name">Item: {req.displayName || req.productName}</div>
                                    <div className="info-group"><span>Requester:</span> {req.requesterName}</div>
                                </div>
                                <div className="admin-action-buttons">
                                    <button className="btn-approve" onClick={() => updateDoc(doc(db, "volunteer_requests", req.id), {status: "approved"})}>Verify</button>
                                    <button className="btn-reject" onClick={() => updateDoc(doc(db, "volunteer_requests", req.id), {status: "rejected"})}>Decline</button>
                                </div>
                            </div>

                            {/* Chat Box for Volunteer Requests */}
                            <div className="admin-chat-box">
                                <div className="messages-list-web">
                                    {req.comments?.filter(c => c.stage === 'admin_review').map((c, i) => (
                                        <div key={i} className={`msg-bubble-web ${c.senderRole === 'admin' ? 'me' : 'other'}`}>
                                            <span className="sender-name-web">{c.senderRole === 'admin' ? "Admin" : "Student"}</span>
                                            <p>{c.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="chat-input-web">
                                    <input type="text" placeholder="Message student..." value={commentText[req.id] || ""} onChange={(e) => setCommentText({...commentText, [req.id]: e.target.value})} />
                                    <button onClick={() => handleAdminChat(req.id, "volunteer_requests")}>Send</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AllRequests;
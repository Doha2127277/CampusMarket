import React, { useEffect, useState } from 'react';
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from "firebase/firestore";
import './AllRequests.css';

const AllRequests = () => {
    const [products, setProducts] = useState([]); // للمنتجات الجديدة
    const [volunteerRequests, setVolunteerRequests] = useState([]); // لطلبات التطوع (جديد)
    const [loading, setLoading] = useState(true);
    const [userNames, setUserNames] = useState({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [activeTab, setActiveTab] = useState('products'); // لتبديل العرض

    useEffect(() => {
        const checkAdminStatus = async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    setIsAdmin(userDoc.exists() && userDoc.data().role === "admin");
                } catch {
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
            setVerifying(false);
        };

        const unsubscribeAuth = auth.onAuthStateChanged(checkAdminStatus);

        // 1. مراقبة المنتجات الجديدة المنتظرة للموافقة
        const qProducts = query(collection(db, "products"), where("status", "==", "pending"));
        const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 2. مراقبة طلبات التطوع الجديدة (Volunteer Verification)
        const qVolunteer = query(collection(db, "volunteer_requests"), where("status", "==", "pending_admin"));
        const unsubscribeVolunteer = onSnapshot(qVolunteer, (snapshot) => {
            setVolunteerRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeProducts();
            unsubscribeVolunteer();
        };
    }, []);

    // وظيفة عامة لجلب الأسماء
    const fetchUserName = async (userId) => {
        if (!userId || userNames[userId]) return;
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            setUserNames(prev => ({ ...prev, [userId]: userDoc.data().fullName }));
        }
    };

    // مراجعة المنتجات العادية
    const handleProductStatus = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, "products", id), { status: newStatus });
            alert(`Product ${newStatus}!`);
        } catch (error) { console.error(error); }
    };

    // مراجعة طلبات التطوع (نقلها للمتبرع)
    const handleVolunteerStatus = async (id, newStatus) => {
        try {
            // لو وافق، الحالة تتحول لـ pending_donor عشان تظهر لصاحب الشيء
            const finalStatus = newStatus === 'approved' ? 'pending_donor' : 'rejected';
            await updateDoc(doc(db, "volunteer_requests", id), { status: finalStatus });
            alert(`Volunteer request ${newStatus === 'approved' ? 'sent to donor' : 'rejected'}!`);
        } catch (error) { console.error(error); }
    };

    if (verifying) return <div className="admin-container"><p className="status-text">Verifying Access...</p></div>;

    if (!isAdmin) return <div className="admin-container"><h2 style={{ color: '#ef4444', textAlign: 'center' }}>Access Denied</h2></div>;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1 className="admin-title">Admin Control Center</h1>
                <div className="admin-tabs">
                    <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
                        New Products ({products.length})
                    </button>
                    <button className={activeTab === 'volunteer' ? 'active' : ''} onClick={() => setActiveTab('volunteer')}>
                        Volunteer Verification ({volunteerRequests.length})
                    </button>
                </div>
            </header>

            {loading ? <p className="status-text">Loading...</p> : (
                <div className="requests-list">
                    {activeTab === 'products' ? (
                        products.map(product => (
                            <div key={product.id} className="request-row">
                                <img src={product.photoURL} alt="" className="product-img-admin" />
                                <div className="request-info">
                                    <div className="product-name">{product.name}</div>
                                    <div className="info-group"><span>Price:</span> {product.price === 0 ? "Donation" : `${product.price} EGP`}</div>
                                    <div className="info-group"><span>Seller ID:</span> {product.userId}</div>
                                </div>
                                <div className="button-group">
                                    <button onClick={() => handleProductStatus(product.id, "approved")} className="btn-approve">Approve</button>
                                    <button onClick={() => handleProductStatus(product.id, "rejected")} className="btn-reject">Reject</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        volunteerRequests.map(req => (
                            <div key={req.id} className="request-row volunteer-row">
                                <div className="request-info">
                                    <div className="product-name">Request for: {req.productName}</div>
                                    <div className="info-group"><span>Requester:</span> {req.requesterName}</div>
                                    <div className="info-group"><span>Reason:</span> "Requesting this item for study use"</div>
                                </div>
                                <div className="button-group">
                                    <button onClick={() => handleVolunteerStatus(req.id, "approved")} className="btn-approve">Verify & Send to Donor</button>
                                    <button onClick={() => handleVolunteerStatus(req.id, "rejected")} className="btn-reject">Decline</button>
                                </div>
                            </div>
                        ))
                    )}
                    {(activeTab === 'products' ? products : volunteerRequests).length === 0 && <p className="status-text">Nothing to review here.</p>}
                </div>
            )}
        </div>
    );
};

export default AllRequests;

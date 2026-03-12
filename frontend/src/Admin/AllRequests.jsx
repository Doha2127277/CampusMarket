import React, { useEffect, useState } from 'react';
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from "firebase/firestore";
import './AllRequests.css';

const AllRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userNames, setUserNames] = useState({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().role === "admin") {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                } catch {
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
            setVerifying(false);
        };

        const unsubscribeAuth = auth.onAuthStateChanged(checkAdminStatus);

        const q = query(collection(db, "products"), where("status", "==", "pending"));
        const unsubscribeDocs = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(data);
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeDocs();
        };
    }, []);

    useEffect(() => {
        const fetchUserNames = async () => {
            const names = { ...userNames };
            for (let req of requests) {
                if (req.userId && !names[req.userId]) {
                    const userDoc = await getDoc(doc(db, "users", req.userId));
                    if (userDoc.exists()) {
                        names[req.userId] = userDoc.data().fullName;
                    }
                }
            }
            setUserNames(names);
        };
        if (requests.length > 0) fetchUserNames();
    }, [requests]);

    const handleStatus = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, "products", id), { status: newStatus });
            alert(`Request ${newStatus} successfully!`);
        } catch (error) {
            console.error(error);
        }
    };

    if (verifying) return <div className="admin-container"><p className="status-text">Verifying Access...</p></div>;

    if (!isAdmin) {
        return (
            <div className="admin-container">
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <h2 style={{ color: '#ef4444' }}>Access Denied</h2>
                    <p>Administrators only.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1 className="admin-title">Marketplace Requests</h1>
            </header>

            {loading ? (
                <p className="status-text">Loading...</p>
            ) : (
                <div className="requests-list">
                    {requests.map((req) => (
                        <div key={req.id} className="request-row">
                            <div className="request-info">
                                <div className="product-name">{req.name}</div>
                                
                                <div className="info-group">
                                    <span className="info-label">Description</span>
                                    <span className="info-value">{req.description}</span>
                                </div>

                                <div className="info-group">
                                    <span className="info-label">Category</span>
                                    <span className="info-value">{req.category}</span>
                                </div>

                                <div className="info-group">
                                    <span className="info-label">Price</span>
                                    <span className="info-value">{req.price} EGP</span>
                                </div>

                                <div className="info-group">
                                    <span className="info-label">Seller</span>
                                    <span className="info-value">{userNames[req.userId] || "..."}</span>
                                </div>
                            </div>

                            <div className="button-group">
                                <button onClick={() => handleStatus(req.id, "approved")} className="btn-approve">Approve</button>
                                <button onClick={() => handleStatus(req.id, "rejected")} className="btn-reject">Reject</button>
                            </div>
                        </div>
                    ))}
                    {requests.length === 0 && <p className="status-text">No pending requests found.</p>}
                </div>
            )}
        </div>
    );
};

export default AllRequests;
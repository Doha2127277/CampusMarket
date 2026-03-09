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
                        names[req.userId] = userDoc.data().fullName || userDoc.data().name;
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

    if (verifying) {
        return <div className="admin-container"><p className="status-text">Verifying Admin Access...</p></div>;
    }

    if (!isAdmin) {
        return (
            <div className="admin-container">
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
                    <h2>🚫 Access Denied</h2>
                    <p>This dashboard is for authorized administrators only.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1 className="admin-title">Admin Dashboard - Market Requests</h1>
            </header>

            {loading ? (
                <p className="status-text">Loading items...</p>
            ) : (
                <div className="requests-grid">
                    {requests.map((req) => (
                        <div key={req.id} className="request-card">
                            <div className="card-content">
                                <h3>{req.name}</h3>
                                <p><strong>Description:</strong> {req.description}</p>
                                <p><strong>Category:</strong> {req.category}</p>
                                <p><strong>Price:</strong> {req.price} EGP</p>
                                <p><strong>Seller:</strong> {userNames[req.userId] || "Loading..."}</p>
                                <div className="button-group">
                                    <button onClick={() => handleStatus(req.id, "approved")} className="btn-approve">Approve</button>
                                    <button onClick={() => handleStatus(req.id, "rejected")} className="btn-reject">Reject</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {requests.length === 0 && <p className="status-text">No pending requests.</p>}
                </div>
            )}
        </div>
    );
};

export default AllRequests;
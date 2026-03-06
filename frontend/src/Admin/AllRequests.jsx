import React, { useEffect, useState } from 'react';
import { db } from "../firebase";
import { collection, query, where, onSnapshot, updateDoc, doc,getDoc } from "firebase/firestore";
import './AllRequests.css';

const AllRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userNames, setUserNames] = useState({});
    useEffect(() => {
        const q = query(collection(db, "products"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        const fetchUserNames = async () => {
            const names = {};
            for (let req of requests) {
                if (req.userId && !userNames[req.userId]) {
                    const userDoc = await getDoc(doc(db, "users", req.userId));
                    if (userDoc.exists()) {
                        names[req.userId] = userDoc.data().fullName; // الحقل name في users
                    } else {
                        names[req.userId] = "Unknown";
                    }
                }
            }
            setUserNames(prev => ({ ...prev, ...names }));
        };

        if (requests.length > 0) {
            fetchUserNames();
        }
    }, [requests]);
    const handleStatus = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, "products", id), { status: newStatus });
            alert(`Request ${newStatus} successfully!`);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="admin-container">

            <header className="admin-header">
                <h1 className="admin-title">Admin Dashboard - Market Requests</h1>
            </header>

            {loading ? (
                <p className="status-text">Loading...</p>
            ) : requests.length === 0 ? (
                <p className="status-text">No pending requests.</p>
            ) : (

                <div className="requests-grid">

                    {requests.map((req) => (

                        <div key={req.id} className="request-card">

                            {/* {req.photoURL && (
                                <div className="image-container">
                                    <img
                                        src={req.photoURL}
                                        alt={req.name}
                                        className="product-image"
                                    />
                                </div>
                            )} */}
                            <div className="card-content">
                                <h3>{req.name}</h3>

                                <p><strong>Description:</strong> {req.description}</p>

                                <p><strong>Category:</strong> {req.category}</p>

                                <p><strong>Type:</strong> {req.type}</p>

                                <p><strong>Mode:</strong> {req.mode}</p>

                                <p><strong>Price:</strong> {req.price} EGP</p>
                                <p><strong>Seller:</strong> {userNames[req.userId]  || "Unknown"}</p>
                                <div className="button-group">

                                    <button
                                        onClick={() => handleStatus(req.id, "approved")}
                                        className="btn-approve"
                                    >
                                        Approve
                                    </button>

                                    <button
                                        onClick={() => handleStatus(req.id, "rejected")}
                                        className="btn-reject"
                                    >
                                        Reject
                                    </button>

                                </div>

                            </div>
                        </div>
                    ))}

                </div>

            )}

            {!loading && requests.length === 0 && (
                <p className="status-text">No pending requests.</p>
            )}

        </div>
    );
};

export default AllRequests;
import React, { useEffect, useState } from 'react';
import { db } from "../firebase"; 
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import './AllRequests.css';

const AllRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "products"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
            ) : (
                <div className="requests-grid">
                    {requests.map((req) => (
                        <div key={req.id} className="request-card">
                            <h3>{req.name}</h3>
                            <span className={`badge ${req.type === 'donation' ? 'badge-donation' : 'badge-sale'}`}>
                                {req.type === 'donation' ? 'Free Donation' : 'For Sale'}
                            </span>
                            <p className="description"><strong>Description:</strong> {req.description}</p>
                            <div className="button-group">
                                <button onClick={() => handleStatus(req.id, 'approved')} className="btn-approve">Approve</button>
                                <button onClick={() => handleStatus(req.id, 'rejected')} className="btn-reject">Reject</button>
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
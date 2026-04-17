import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './SellerRequests.css';

function SellerRequests() {
  const [orders, setOrders] = useState([]); // المبيعات العادية
  const [donations, setDonations] = useState([]); // طلبات التبرع (جديد)
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState({});
  const [activeTab, setActiveTab] = useState('sales'); // التبديل بين المبيعات والتبرعات

  useEffect(() => {
    if (!auth.currentUser) return;

    // 1. مراقبة المبيعات العادية (Orders)
    const qOrders = query(collection(db, "orders"), where("sellerId", "==", auth.currentUser.uid));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    // 2. مراقبة طلبات التبرع (Volunteer Requests) - اللي وافق عليها الأدمن بس
    const qDonations = query(
      collection(db, "volunteer_requests"), 
      where("sellerId", "==", auth.currentUser.uid),
      where("status", "==", "pending_donor")
    );
    const unsubscribeDonations = onSnapshot(qDonations, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDonations(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeDonations();
    };
  }, []);

  // تحديث حالة مبيعات بفلوس
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      alert(`Order ${newStatus}`);
    } catch (error) { console.error(error); }
  };

  // تحديث حالة طلب تبرع (القرار النهائي للمتبرع)
  const updateDonationStatus = async (reqId, newStatus) => {
    try {
      const status = newStatus === 'approved' ? 'approved' : 'rejected';
      await updateDoc(doc(db, "volunteer_requests", reqId), { status: status });
      alert(status === 'approved' ? "Donation Approved! Student can now contact you." : "Request Declined.");
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="loading-state">Loading Manager...</div>;

  return (
    <div className="seller-requests-container">
      <header className="seller-header-web">
        <h1 className="seller-title-web">Provider Dashboard</h1>
        <div className="admin-tabs">
            <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>
                Commercial Sales ({orders.length})
            </button>
            <button className={activeTab === 'donations' ? 'active' : ''} onClick={() => setActiveTab('donations')}>
                Donation Approvals ({donations.length})
            </button>
        </div>
      </header>

      <div className="orders-grid-web">
        {activeTab === 'sales' ? (
          orders.length === 0 ? <div className="no-orders-web">No sales yet.</div> :
          orders.map((order) => (
            <div key={order.id} className="seller-horizontal-card">
              <div className="order-info-section">
                <div className={`status-badge-web ${order.status?.toLowerCase()}`}>{order.status || "Pending"}</div>
                <p className="buyer-name-web">Buyer: {order.buyerName || "Student"}</p>
                <div className="products-mini-list">
                  {order.items?.map((prod, i) => (
                    <div key={i} className="product-row-web">
                      <img src={prod.photoURL} alt="" className="mini-prod-img" />
                      <div className="mini-prod-info">
                        <span className="mini-name">{prod.name}</span>
                        <span className="mini-price">{prod.price} EGP</span>
                      </div>
                    </div>
                  ))}
                </div>
                {order.status === "pending" && (
                  <div className="seller-actions">
                    <button className="approve-btn-web" onClick={() => updateOrderStatus(order.id, "approved")}>Approve</button>
                    <button className="reject-btn-web" onClick={() => updateOrderStatus(order.id, "rejected")}>Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          // عرض طلبات التبرع (Professional View)
          donations.length === 0 ? <div className="no-orders-web">No pending donations to approve.</div> :
          donations.map((req) => (
            <div key={req.id} className="seller-horizontal-card donation-card-style">
              <div className="order-info-section">
                <div className="status-badge-web verified">Verified by Admin ✅</div>
                <h3 className="donation-title">Item: {req.productName}</h3>
                <p className="buyer-name-web">Requested by: <strong>{req.requesterName}</strong></p>
                <p className="order-date-web">The admin has verified this student's eligibility.</p>
                
                <div className="seller-actions" style={{marginTop: '20px'}}>
                  <button className="approve-btn-web" style={{backgroundColor: '#3b82f6'}} onClick={() => updateDonationStatus(req.id, "approved")}>
                    Confirm Donation 🎁
                  </button>
                  <button className="reject-btn-web" onClick={() => updateDonationStatus(req.id, "rejected")}>Decline</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SellerRequests;

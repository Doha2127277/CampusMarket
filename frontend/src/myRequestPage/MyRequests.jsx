import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './MyRequests.css'; // تأكدي من إنشاء هذا الملف

function MyRequests() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, "orders"), where("buyerId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        const ordersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersList);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="loading-state">جاري تحميل طلباتك...</div>;
  if (orders.length === 0) return <div className="no-products">لا توجد طلبات حالياً.</div>;

  return (
    <div className="main-wrapper">
      <header className="hero" style={{ padding: '20px 0' }}>
        <h1 className="hero-title">My Orders</h1>
      </header>

      <div className="home-container">
        <div className="products-grid">
          {orders.map((order) => (
            <div key={order.id} className="product-card">
              <img
                src={order.productImage || "https://via.placeholder.com/300"}
                alt={order.productName}
                className="product-image"
              />

              <div className="product-info">
                <div className="product-header">
                  <h3 className="product-name">{order.productName}</h3>
                  <span className="product-price">
                    {order.productPrice} EGP
                  </span>
                </div>

                <div className="product-footer" style={{ marginTop: '15px' }}>
                  {/* Badge لحالة الطلب */}
                  <span className={`mode-badge ${order.status}`}>
                    {order.status === 'pending' ? 'قيد الانتظار' : order.status}
                  </span>
                  
                  <span className="date-text">
                    {order.createdAt?.seconds
                      ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                      : "حديثاً"}
                  </span>
                </div>

                <p className="product-description" style={{ fontSize: '0.9rem', marginTop: '10px' }}>
                  <strong>طريقة الدفع:</strong> {order.paymentMethod === 'cash_on_delivery' ? 'كاش عند الاستلام' : order.paymentMethod}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyRequests;
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

function SellerRequests() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.currentUser) return;

      const q = query(
        collection(db, "orders"),
        where("sellerId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersList);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>جاري تحميل الطلبات...</div>;
  if (orders.length === 0) return <div style={{textAlign: 'center', padding: '50px'}}>لا توجد طلبات حتى الآن.</div>;

  return (
    <div style={{ maxWidth: '900px', margin: 'auto', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>طلبات العملاء على منتجاتي</h1>
      {orders.map(order => (
        <div key={order.id} style={{border: '1px solid #ccc', borderRadius: '10px', padding: '20px', marginBottom: '15px', backgroundColor: '#f9f9f9'}}>
          <h2>{order.productName}</h2>
          <p><strong>العميل:</strong> {order.buyerName}</p>
          <p><strong>الحالة:</strong> {order.status || "في الانتظار"}</p>
          <p><strong>طريقة الدفع:</strong> {order.paymentMethod}</p>
          <p><strong>تاريخ الطلب:</strong> {order.createdAt?.toDate().toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export default SellerRequests;
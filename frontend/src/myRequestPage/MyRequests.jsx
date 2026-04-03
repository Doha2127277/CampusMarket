
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function MyRequests() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.currentUser) return;
      const q = query(collection(db, "orders"), where("buyerId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersList);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>جاري تحميل الطلبات...</div>;
  if (orders.length === 0) return <div style={{padding: '50px', textAlign: 'center'}}>لا يوجد طلبات حتى الآن.</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>طلباتي</h1>
      {orders.map(order => (
        <div key={order.id} style={{border: '1px solid #ccc', padding: '20px', marginBottom: '15px', borderRadius: '12px', backgroundColor: '#f8f9fa'}}>
          <h2 style={{marginBottom: '10px'}}>{order.productName}</h2>
          <p><strong>الحالة:</strong> {order.status}</p>
          <p><strong>طريقة الدفع:</strong> {order.paymentMethod}</p>
        </div>
      ))}
    </div>
  );
}

export default MyRequests; 
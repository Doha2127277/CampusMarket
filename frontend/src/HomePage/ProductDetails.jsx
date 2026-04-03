import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore';

function ProductDetails() {
  const { id } = useParams(); 
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProductData = async () => {
      try {
        const docRef = doc(db, "products", id); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error getting document:", error);
      }
      setLoading(false);
    };
    getProductData();
  }, [id]);

  if (loading) return <div style={{padding: '50px', textAlign: 'center', fontSize: '20px'}}>جاري تحميل التفاصيل...</div>;
  if (!product) return <div style={{padding: '50px', textAlign: 'center', fontSize: '20px'}}>المنتج غير موجود!</div>;

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      minHeight: '80vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {}
      <div style={{ 
        width: '350px', 
        height: '350px', 
        marginBottom: '20px', 
        borderRadius: '15px', 
        overflow: 'hidden',
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        backgroundColor: '#f9f9f9'
      }}>
        <img 
          src={product.photoURL || "https://via.placeholder.com/350"} 
          alt={product.name} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain' 
          }} 
        />
      </div>

      <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '10px' }}>{product.name}</h1>
      
      <h3 style={{ color: '#2ecc71', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '20px' }}>
        {product.price} EGP
      </h3>
      
      <div style={{ 
        maxWidth: '700px', 
        padding: '25px', 
        borderRadius: '12px', 
        backgroundColor: '#f8f9fa',
        lineHeight: '1.8',
        fontSize: '1.1rem',
        color: '#444',
        marginBottom: '20px',
        border: '1px solid #eee'
      }}>
        {product.description}
      </div>
      
      <div style={{ marginBottom: '30px', fontSize: '1.2rem' }}>
        <span style={{ color: '#777' }}>القسم:</span> 
        <span style={{ fontWeight: 'bold', marginLeft: '5px', color: '#333' }}>{product.category}</span>
        <span style={{ margin: '0 15px', color: '#ccc' }}>|</span>
        <span style={{ color: '#777' }}>النوع:</span> 
        <span style={{ fontWeight: 'bold', marginLeft: '5px', color: '#333' }}>{product.type}</span>
      </div>

      <button style={{ 
        padding: '15px 50px', 
        cursor: 'pointer', 
        backgroundColor: '#2ecc71', 
        color: 'white', 
        border: 'none', 
        borderRadius: '30px',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        transition: '0.3s ease',
        boxShadow: '0 5px 15px rgba(46, 204, 113, 0.4)'
      }}
      onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      onClick={() => alert('Added to Cart!')}
      >
        Add to Cart
      </button>
    </div>
  );
}

export default ProductDetails;
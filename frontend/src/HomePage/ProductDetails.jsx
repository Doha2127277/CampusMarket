import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

function ProductDetails() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInCart, setIsInCart] = useState(false);
  const [sellerName, setSellerName] = useState("...");
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const getProductData = async () => {
      try {
        const docRef = doc(db, "products", id); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() };
          setProduct(productData);

          const sId = productData.sellerId || productData.userId || productData.uid;
          
          if (sId) {
            const userSnap = await getDoc(doc(db, "users", sId));
            if (userSnap.exists()) {
              setSellerName(userSnap.data().fullName || "Campus User");
            }
          }

          if (auth.currentUser) {
            const cartKey = `cart_${auth.currentUser.uid}`;
            const savedCart = JSON.parse(localStorage.getItem(cartKey)) || [];
            setCart(savedCart);
            setIsInCart(savedCart.some(item => item.id === productData.id));
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
      setLoading(false);
    };
    getProductData();
  }, [id]);

  // --- الجزء الخاص بالبيع (السلة العادية) ---
  const handleToggleCart = () => {
    if (!auth.currentUser) return alert("Please log in first!");

    const cartKey = `cart_${auth.currentUser.uid}`;
    let updatedCart;

    if (isInCart) {
      updatedCart = cart.filter(item => item.id !== product.id);
    } else {
      updatedCart = [...cart, { ...product, id: id }];
    }

    setCart(updatedCart);
    setIsInCart(!isInCart);
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("storage"));
  };

  // --- الجزء الخاص بالتطوع (الطلب البروفيشنال) ---
  const handleVolunteerRequest = async () => {
    if (!auth.currentUser) return alert("Please log in first!");

    try {
      const requestData = {
        productId: product.id,
        productName: product.name,
        requesterId: auth.currentUser.uid,
        requesterName: auth.currentUser.displayName || "Student",
        sellerId: product.sellerId || product.userId || product.uid,
        status: "pending_admin", // البداية عند الأدمن للمراجعة
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "volunteer_requests"), requestData);
      alert("Request Sent! It's now under Verification by Admin. ✨");
    } catch (error) {
      console.error("Error sending volunteer request:", error);
      alert("Something went wrong, try again.");
    }
  };

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>;
  if (!product) return <div style={{padding: '50px', textAlign: 'center'}}>Product not found!</div>;

  const isOwner = auth.currentUser?.uid === (product.sellerId || product.userId || product.uid);

  const formattedDate = product.createdAt?.seconds 
    ? new Date(product.createdAt.seconds * 1000).toLocaleDateString() 
    : "Recently";

  return (
    <div style={styles.mainContainer}>
      <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
          <h2 style={styles.headerTitle}>Product Details</h2>
          <div style={{width: '60px'}}></div>
      </div>

      <div style={styles.gridContainer}>
        <div style={styles.imageSection}>
          <div style={styles.imageWrapper}>
             <img src={product.photoURL} alt={product.name} style={styles.img} />
             <div style={{
                ...styles.modeBadge, 
                backgroundColor: product.price === 0 ? '#3b82f6' : '#10b981'
             }}>
                {product.price === 0 ? "Donation" : product.mode}
             </div>
          </div>
        </div>

        <div style={styles.infoSection}>
          <h1 style={styles.title}>{product.name}</h1>
          
          <div style={styles.priceRow}>
             <span style={styles.price}>{product.price === 0 ? "Free" : `${product.price} EGP`}</span>
             <span style={styles.categoryBadge}>{product.category}</span>
          </div>

          <div style={styles.sellerRow}>
             <span style={styles.sellerIcon}>👤</span>
             <span style={styles.sellerText}>Sold by: <strong>{sellerName}</strong></span>
             <span style={styles.dot}>•</span>
             <span style={styles.dateText}>{formattedDate}</span>
          </div>

          <hr style={styles.divider} />

          <div style={styles.descriptionSection}>
             <h3 style={styles.secTitle}>Description</h3>
             <p style={styles.descContent}>{product.description || "No description provided."}</p>
          </div>

          {/* التحكم في الأزرار بناءً على السعر والملكية */}
          {isOwner ? (
            <button 
              style={{...styles.cartBtn, backgroundColor: '#94a3b8', cursor: 'not-allowed'}}
              disabled
            >
              Your Product (Owned) ✨
            </button>
          ) : (
            <>
              {product.price === 0 ? (
                /* زرار الجزء التطوعي */
                <button 
                  style={{...styles.cartBtn, backgroundColor: '#3b82f6'}} 
                  onClick={handleVolunteerRequest}
                >
                  Request Assistance 🤝
                </button>
              ) : (
                /* زرار السلة للمنتجات المدفوعة */
                <button 
                  style={{...styles.cartBtn, backgroundColor: isInCart ? '#ef4444' : '#10b981'}}
                  onClick={handleToggleCart}
                >
                  {isInCart ? "Remove from Cart 🗑️" : "Add to Cart 🛒"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  mainContainer: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  backBtn: { padding: '8px 15px', borderRadius: '10px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: '600', color: '#475569' },
  headerTitle: { fontSize: '1.2rem', color: '#1e293b' },
  gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '50px', alignItems: 'start' },
  imageSection: { display: 'flex', justifyContent: 'center' },
  imageWrapper: { position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 25px rgba(0,0,0,0.1)', width: '100%', aspectRatio: '1/1', backgroundColor: '#fff' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  modeBadge: { position: 'absolute', bottom: '15px', right: '15px', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' },
  infoSection: { textAlign: 'left', display: 'flex', flexDirection: 'column' },
  title: { fontSize: '2.2rem', color: '#0f172a', margin: '0 0 10px 0' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  price: { fontSize: '1.8rem', fontWeight: '900', color: '#10b981' },
  categoryBadge: { background: '#eff6ff', color: '#3b82f6', padding: '5px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' },
  sellerRow: { display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' },
  sellerIcon: { marginRight: '8px', fontSize: '1.1rem' },
  dot: { margin: '0 10px', color: '#cbd5e1' },
  dateText: { color: '#94a3b8' },
  divider: { border: '0', borderTop: '1px solid #f1f5f9', margin: '15px 0' },
  descriptionSection: { marginBottom: '20px' },
  secTitle: { fontSize: '1rem', color: '#1e293b', marginBottom: '8px', fontWeight: 'bold' },
  descContent: { color: '#475569', lineHeight: '1.6', fontSize: '1rem', margin: 0 },
  cartBtn: { width: '100%', padding: '16px', border: 'none', borderRadius: '12px', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }
};

export default ProductDetails;

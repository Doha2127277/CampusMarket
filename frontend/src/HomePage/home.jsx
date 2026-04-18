import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc, getDocs, serverTimestamp } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import './Home.css';

function Home() { 
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [volunteerRequests, setVolunteerRequests] = useState([]); // لتتبع المنتجات المطلوبة في القلب
    
    const [cart, setCart] = useState(() => {
        const user = auth.currentUser;
        const saved = user ? localStorage.getItem(`cart_${user.uid}`) : null;
        return saved ? JSON.parse(saved) : [];
    });

    const navigate = useNavigate();
    const location = useLocation();
    const categories = ["All", "Engineering", "Medicine", "Business"];

    // جلب المنتجات
    useEffect(() => {
        const q = query(collection(db, "products"), where("status", "==", "approved"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const productsArray = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.isSold) productsArray.push({ ...data, id: doc.id });
            });
            setProducts(productsArray);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // مراقبة طلبات المساعدة (القلب) لتحديث الزرار لايف
    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(collection(db, "volunteer_requests"), where("requesterId", "==", auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqIds = snapshot.docs.map(doc => doc.data().productId);
            setVolunteerRequests(reqIds);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const syncCart = () => {
            const user = auth.currentUser;
            if (user) {
                const savedCart = localStorage.getItem(`cart_${user.uid}`);
                setCart(savedCart ? JSON.parse(savedCart) : []);
            }
        };
        const unsubscribeAuth = auth.onAuthStateChanged((user) => syncCart());
        window.addEventListener("storage", syncCart);
        return () => {
            unsubscribeAuth();
            window.removeEventListener("storage", syncCart);
        };
    }, []);

    useEffect(() => {
        let result = products;
        const searchFromNav = location.state?.search || "";
        if (activeCategory !== "All") result = result.filter(p => p.category === activeCategory);
        if (searchFromNav) {
            result = result.filter(p => p.name.toLowerCase().includes(searchFromNav.toLowerCase()));
        }
        setFilteredProducts(result);
    }, [products, activeCategory, location.state]);

    // وظيفة القلب (إضافة وحذف)
    const handleVolunteerToggle = async (e, product) => {
        e.stopPropagation();
        if (!auth.currentUser) { navigate("/login"); return; }

        const existingQuery = query(
            collection(db, "volunteer_requests"),
            where("requesterId", "==", auth.currentUser.uid),
            where("productId", "==", product.id)
        );
        const snapshot = await getDocs(existingQuery);

        if (!snapshot.empty) {
            await deleteDoc(doc(db, "volunteer_requests", snapshot.docs[0].id));
        } else {
            await addDoc(collection(db, "volunteer_requests"), {
                requesterId: auth.currentUser.uid,
                sellerId: product.userId || product.sellerId,
                productId: product.id,
                productName: product.name,
                status: "pending_admin",
                createdAt: serverTimestamp(),
            });
        }
    };

    const handleCartToggle = (e, product) => {
        e.stopPropagation();
        if (!auth.currentUser) { navigate("/login"); return; }
        const cartKey = `cart_${auth.currentUser.uid}`;
        const isInCart = cart.some(item => String(item.id) === String(product.id));
        let updatedCart = isInCart 
            ? cart.filter(item => String(item.id) !== String(product.id))
            : [...cart, product];

        setCart(updatedCart);
        localStorage.setItem(cartKey, JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("storage")); 
    };

    if (loading) return <div className="loading-state">Loading...</div>;

    return (
        <div className="main-wrapper">
            <div className="home-container">
                <div className="filter-chips">
                    {categories.map(cat => (
                        <button key={cat} className={`chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="products-grid">
                    {filteredProducts.map((product) => {
                        const isInCart = cart.some(item => String(item.id) === String(product.id));
                        const isRequested = volunteerRequests.includes(product.id);
                        const isOwner = auth.currentUser && (product.sellerId === auth.currentUser.uid || product.userId === auth.currentUser.uid);
                        const isFree = Number(product.price) === 0;

                        return (
                            <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                                <div className="product-badge" style={{
                                    position: 'absolute', top: '10px', left: '10px',
                                    backgroundColor: isFree ? '#3b82f6' : '#f59e0b',
                                    color: 'white', padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', zIndex: 1
                                }}>
                                    {isFree ? "DONATION" : "FOR SALE"}
                                </div>
                                <img src={product.photoURL} alt="" className="product-image" />
                                <div className="product-info">
                                    <div className="product-header">
                                        <h3 className="product-name">{product.name}</h3>
                                        <span className="product-price">{isFree ? "Free" : `${product.price} EGP`}</span>
                                    </div>
                                    <span className="product-category">{product.category}</span>
                                    <div className="card-actions-row">
                                        {!isOwner && (
                                            isFree ? (
                                                <button 
                                                    className={`cart-action-btn ${isRequested ? 'remove' : 'add'}`} 
                                                    style={{ backgroundColor: isRequested ? '#ef4444' : '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    onClick={(e) => handleVolunteerToggle(e, product)}
                                                >
                                                    {isRequested ? "Remove 🗑️" : "Add ❤️"}
                                                </button>
                                            ) : (
                                                <button 
                                                    className={`cart-action-btn ${isInCart ? 'remove' : 'add'}`} 
                                                    style={{ backgroundColor: isInCart ? '#ef4444' : '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    onClick={(e) => handleCartToggle(e, product)}
                                                >
                                                    {isInCart ? "Remove 🗑️" : "Add 🛒"}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Home;

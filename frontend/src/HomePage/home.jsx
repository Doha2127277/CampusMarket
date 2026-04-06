import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import './Home.css';

function Home() { 
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    
    // 1. التعديل السحري: السلة بتقرأ من الجهاز فوراً أول ما الـ Component يبدأ
    const [cart, setCart] = useState(() => {
        // بنحاول نجيب أي سلة متسيفة لليوزر ده عشان الزراير متظهرش خضراء في أول ثانية
        const user = auth.currentUser;
        const saved = user ? localStorage.getItem(`cart_${user.uid}`) : null;
        return saved ? JSON.parse(saved) : [];
    });

    const navigate = useNavigate();
    const location = useLocation();
    const categories = ["All", "Engineering", "Medicine", "Business"];

    // 2. جلب المنتجات (زي ما هي)
    useEffect(() => {
        const q = query(collection(db, "products"), where("status", "==", "approved"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const productsArray = [];
            querySnapshot.forEach((doc) => {
                productsArray.push({ ...doc.data(), id: doc.id });
            });
            setProducts(productsArray);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 3. المزامنة عند فتح الصفحة ومراقبة الـ Auth والـ Storage
    useEffect(() => {
        const syncCart = () => {
            const user = auth.currentUser;
            if (user) {
                const savedCart = localStorage.getItem(`cart_${user.uid}`);
                setCart(savedCart ? JSON.parse(savedCart) : []);
            }
        };

        // بنراقب حالة اليوزر أول ما يفتح عشان السلة تتحدث لو عمل ريفرش
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            syncCart();
        });

        window.addEventListener("storage", syncCart);
        return () => {
            unsubscribeAuth();
            window.removeEventListener("storage", syncCart);
        };
    }, []);

    // 4. الفلترة والبحث (زي ما هي)
    useEffect(() => {
        let result = products;
        const searchFromNav = location.state?.search || "";
        if (activeCategory !== "All") result = result.filter(p => p.category === activeCategory);
        if (searchFromNav) {
            result = result.filter(p => p.name.toLowerCase().includes(searchFromNav.toLowerCase()));
        }
        setFilteredProducts(result);
    }, [products, activeCategory, location.state]);

    // 5. دالة الإضافة والحذف مع ضمان عدم التصفير
    const handleCartToggle = (e, product) => {
        e.stopPropagation();
        if (!auth.currentUser) {
            navigate("/login");
            return;
        }

        const cartKey = `cart_${auth.currentUser.uid}`;
        // بنستخدم String لضمان إن الـ IDs تتطابق صح
        const isInCart = cart.some(item => String(item.id) === String(product.id));
        let updatedCart;

        if (isInCart) {
            updatedCart = cart.filter(item => String(item.id) !== String(product.id));
        } else {
            updatedCart = [...cart, product];
        }

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
                        <button 
                            key={cat}
                            className={`chip ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="products-grid">
                    {filteredProducts.map((product) => {
                        // تشيك لحظي لكل منتج
                        const isInCart = cart.some(item => String(item.id) === String(product.id));
                        const isOwner = auth.currentUser && product.sellerId === auth.currentUser.uid;

                        return (
                            <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                                <img src={product.photoURL} alt="" className="product-image" />
                                <div className="product-info">
                                    <div className="product-header">
                                        <h3 className="product-name">{product.name}</h3>
                                        <span className="product-price">{product.price} EGP</span>
                                    </div>
                                    <span className="product-category">{product.category}</span>
                                    
                                    <div className="card-actions-row">
                                        {!isOwner && (
                                            <button 
                                                className={`cart-action-btn ${isInCart ? 'remove' : 'add'}`} 
                                                style={{ 
                                                    backgroundColor: isInCart ? '#ef4444' : '#10b981',
                                                    color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer'
                                                }}
                                                onClick={(e) => handleCartToggle(e, product)}
                                            >
                                                {isInCart ? "Remove 🗑️" : "Add 🛒"}
                                            </button>
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
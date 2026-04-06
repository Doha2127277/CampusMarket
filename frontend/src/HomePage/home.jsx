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
    const [cart, setCart] = useState([]); 
    const navigate = useNavigate();
    const location = useLocation();

    const categories = ["All", "Engineering", "Medicine", "Business"];

    // 1. جلب المنتجات (مرة واحدة عند التحميل)
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

    // 2. دالة المزامنة من الـ Storage
    const syncCart = () => {
        if (auth.currentUser) {
            const savedCart = localStorage.getItem(`cart_${auth.currentUser.uid}`);
            const parsedCart = savedCart ? JSON.parse(savedCart) : [];
            setCart(parsedCart);
        }
    };

    // 3. المزامنة عند فتح الصفحة + مراقبة التغييرات الخارجية فقط
    useEffect(() => {
        syncCart();
        
        // بنسمع للتغيير اللي جاي من صفحات تانية (زي ProductDetails)
        window.addEventListener("storage", syncCart);
        return () => window.removeEventListener("storage", syncCart);
    }, []);

    // 4. الفلترة والبحث
    useEffect(() => {
        let result = products;
        const searchFromNav = location.state?.search || "";
        if (activeCategory !== "All") result = result.filter(p => p.category === activeCategory);
        if (searchFromNav) {
            result = result.filter(p => p.name.toLowerCase().includes(searchFromNav.toLowerCase()));
        }
        setFilteredProducts(result);
    }, [products, activeCategory, location.state]);

    // 5. التعامل مع الإضافة والحذف (بدون عمل Loop)
    const handleCartToggle = (e, product) => {
        e.stopPropagation();
        if (!auth.currentUser) {
            navigate("/login");
            return;
        }

        const cartKey = `cart_${auth.currentUser.uid}`;
        const isInCart = cart.some(item => item.id === product.id);
        let updatedCart;

        if (isInCart) {
            updatedCart = cart.filter(item => item.id !== product.id);
        } else {
            updatedCart = [...cart, product];
        }

        // بنحدث الـ State والـ Storage مع بعض يدوياً وبنبعت الإشارة مرة واحدة
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
                        const isInCart = cart.some(item => item.id === product.id);
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
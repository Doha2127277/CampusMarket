import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, onSnapshot, query, where, doc, deleteDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import './Home.css';

function Home() { 
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [cart, setCart] = useState([]); 
    const navigate = useNavigate();
    const location = useLocation();

    const categories = ["All", "Engineering", "Medicine", "Business"];

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

    useEffect(() => {
        if (auth.currentUser) {
            const savedCart = localStorage.getItem(`cart_${auth.currentUser.uid}`);
            if (savedCart) setCart(JSON.parse(savedCart));
        }
    }, []);

    useEffect(() => {
        if (auth.currentUser) {
            localStorage.setItem(`cart_${auth.currentUser.uid}`, JSON.stringify(cart));
        }
    }, [cart]);

    // 🔥 الفلتر + السيرش من الناف بار
    useEffect(() => {
        let result = products;

        const searchFromNav = location.state?.search || searchQuery;

        if (activeCategory !== "All") {
            result = result.filter(p => p.category === activeCategory);
        }

        if (searchFromNav) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchFromNav.toLowerCase())
            );
        }

        setFilteredProducts(result);
    }, [products, searchQuery, activeCategory, location.state]);

    const toggleCart = (e, product) => {
        e.stopPropagation();
        if (!auth.currentUser) {
            alert("Please login first!");
            navigate("/login");
            return;
        }

        if (product.sellerId === auth.currentUser.uid) {
            alert("You cannot buy your own product!");
            return;
        }

        const isInCart = cart.some(item => item.id === product.id);
        if (isInCart) {
            setCart(cart.filter(item => item.id !== product.id));
        } else {
            setCart([...cart, product]);
        }
    };

    const handleDelete = async (e, productId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteDoc(doc(db, "products", productId));
            } catch (error) {
                console.error("Delete error:", error);
            }
        }
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
                                                onClick={(e) => toggleCart(e, product)}
                                            >
                                                {isInCart ? "Remove 🗑️" : "Add 🛒"}
                                            </button>
                                        )}
                                        
                                        {isOwner && (
                                            <button 
                                                className="delete-product-btn" 
                                                onClick={(e) => handleDelete(e, product.id)}
                                            >
                                                Delete 🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="no-products">No products found.</div>
                )}
            </div>
        </div>
    );
}

export default Home;
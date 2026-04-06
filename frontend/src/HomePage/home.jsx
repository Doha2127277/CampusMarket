import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, onSnapshot, query, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import './Home.css';


function Home({ role }) { 
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, "products"));
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

    const handleRequestOrder = async (e, product) => {
        e.stopPropagation();

        
        if (!role || !auth.currentUser) {
            alert("عفواً، يجب تسجيل الدخول أولاً لتتمكن من إرسال طلب!");
            navigate("/login");
            return;
        }

        try {
            await addDoc(collection(db, "orders"), {
                productId: product.id,
                productName: product.name,
                productPrice: product.price,
                productImage: product.photoURL || "",
                buyerId: auth.currentUser.uid,
                buyerName: auth.currentUser.displayName || "No Name",
                sellerId: product.sellerId || "",
                status: "pending",
                paymentMethod: "cash_on_delivery",
                createdAt: serverTimestamp()
            });

            alert("تم إرسال طلبك بنجاح!");
        } catch (error) {
            console.error("Error creating order:", error);
            alert("حدث خطأ أثناء إرسال الطلب");
        }
    };

    if (loading) return <div className="loading">جاري تحميل المنتجات...</div>;

    return (
        <div className="home-container">
            <div className="products-grid">
                {products.map((product) => (
                    <div 
                        key={product.id} 
                        className="product-card"
                        onClick={() => navigate(`/product/${product.id}`)}
                    >
                        <img 
                            src={product.photoURL || "https://via.placeholder.com/300"} 
                            alt={product.name} 
                            className="product-image" 
                        />
                        <div className="product-info">
                            <div className="product-header">
                                <h3 className="product-name">{product.name}</h3>
                                <span className="product-price">{product.price} EGP</span>
                            </div>
                            <p className="product-category">{product.category}</p>
                            <button 
                                className="request-button"
                                onClick={(e) => handleRequestOrder(e, product)}
                            >
                                Request Order
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;
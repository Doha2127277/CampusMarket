import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Home.css"; 

function Cart() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.currentUser) {
            const savedCart = localStorage.getItem(`cart_${auth.currentUser.uid}`);
            if (savedCart) setCart(JSON.parse(savedCart));
        } else {
            navigate("/login"); 
        }
    }, [navigate]);

    const totalPrice = cart.reduce((sum, item) => sum + Number(item.price), 0);

    const removeItem = (id) => {
        const updatedCart = cart.filter(item => item.id !== id);
        setCart(updatedCart);
        localStorage.setItem(`cart_${auth.currentUser.uid}`, JSON.stringify(updatedCart));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);

        try {
            let realName = "Student";
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                realName = userSnap.data().fullName || "Student";
            }

            const ordersBySeller = cart.reduce((acc, item) => {
                const sId = item.userId || item.sellerId || "unknown";
                if (!acc[sId]) {
                    acc[sId] = { items: [], total: 0 };
                }
                acc[sId].items.push(item);
                acc[sId].total += Number(item.price);
                return acc;
            }, {});

            const sellerIds = Object.keys(ordersBySeller);

            await Promise.all(sellerIds.map(async (sId) => {
                const orderData = ordersBySeller[sId];
                await addDoc(collection(db, "orders"), {
                    buyerId: auth.currentUser.uid,
                    buyerName: realName,
                    sellerId: sId,
                    items: orderData.items,
                    totalAmount: orderData.total,
                    status: "pending",
                    createdAt: serverTimestamp(),
                });
            }));

            setCart([]);
            localStorage.removeItem(`cart_${auth.currentUser.uid}`);
            
            alert(`Success! 🎉\nYour order has been split into ${sellerIds.length} separate requests.`);
            
            navigate("/");

        } catch (error) {
            console.error("Error checkout:", error);
            alert("Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-wrapper">
            {/* الهيدر البسيط الخاص بالكارت */}
            <div className="cart-page-header">
                
                <h2>My Cart ({cart.length})</h2>
                <div style={{ width: "40px" }}></div>
            </div>

            <div className="cart-container">
                {cart.length === 0 ? (
                    <div className="empty-cart">
                        <span style={{ fontSize: "5rem" }}>🛒</span>
                        <p>Your cart is empty</p>
                        <button className="shop-now-btn" onClick={() => navigate("/")}>Go Shopping</button>
                    </div>
                ) : (
                    <>
                        <div className="cart-items-list">
                            {cart.map((item) => (
                                <div key={item.id} className="cart-item-card">
                                    <img src={item.photoURL} alt={item.name} className="cart-item-img" />
                                    <div className="cart-item-info">
                                        <h4>{item.name}</h4>
                                        <p className="item-cat">{item.category}</p>
                                        <p className="item-prc">{item.price} EGP</p>
                                    </div>
                                    <button className="remove-item-btn" onClick={() => removeItem(item.id)}>
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* الفوتر اللي فيه الإجمالي والزرار */}
                        <div className="cart-footer">
                            <div className="total-section">
                                <span>Total Amount:</span>
                                <strong>{totalPrice} EGP</strong>
                            </div>
                            <button 
                                className="confirm-btn" 
                                onClick={handleCheckout}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Confirm Order"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Cart;
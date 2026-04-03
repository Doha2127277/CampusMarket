import React, { useState, useEffect } from "react";
import "./Home.css";
import { db, auth } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("status", "==", "approved")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const productsArray = [];
        querySnapshot.forEach((doc) => {
          productsArray.push({ id: doc.id, ...doc.data() });
        });
        setProducts(productsArray);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRequestOrder = async (e, product) => {
    e.stopPropagation();

    if (!auth.currentUser) {
      alert("You must login first!");
      return;
    }

    try {
      await addDoc(collection(db, "orders"), {
        productId: product.id,
        productName: product.name,
        buyerId: auth.currentUser.uid,
        buyerName: auth.currentUser.displayName || "No Name",
        sellerId: product.sellerId || "",
        status: "pending",
        paymentMethod: "cash_on_delivery",
        createdAt: serverTimestamp()
      });

      alert("Order created successfully!");
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="main-wrapper">
      <header className="hero">
        <h1 className="hero-title">Welcome to Campus Market</h1>
        <p className="hero-subtitle">
          The most trusted marketplace to buy and sell textbooks,
          electronics, and student essentials within your university community.
        </p>
      </header>

      <div className="home-container">
        {loading ? (
          <div className="loading-state">Loading products...</div>
        ) : (
          <div className="products-grid">
            {products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={product.photoURL || "https://via.placeholder.com/300"}
                    alt={product.name}
                    className="product-image"
                  />

                  <div className="product-info">
                    <div className="product-header">
                      <h3 className="product-name">{product.name}</h3>
                      <span className="product-price">
                        {product.price} EGP
                      </span>
                    </div>

                    <span className="product-category">
                      {product.category}
                    </span>

                    <p className="product-description">
                      {product.description}
                    </p>

                    <div className="product-footer">
                      <span className="mode-badge">{product.mode}</span>
                      <span className="date-text">
                        {product.createdAt?.seconds
                          ? new Date(
                              product.createdAt.seconds * 1000
                            ).toLocaleDateString()
                          : "Recently"}
                      </span>
                    </div>

                    <button
                      className="add-to-cart-btn"
                      style={{
                        marginTop: "10px",
                        padding: "8px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        width: "100%",
                        cursor: "pointer",
                      }}
                      onClick={(e) => handleRequestOrder(e, product)}
                    >
                      Request Order
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products">
                No approved products available right now.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
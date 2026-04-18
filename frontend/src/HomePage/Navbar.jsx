import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./Home.css";

function Navbar({ role, setRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0); 
  const [pendingGrantsCount, setPendingGrantsCount] = useState(0); 
  const navigate = useNavigate();

  useEffect(() => {
    // 1. تحديث عدد السلة من الـ LocalStorage
    const updateCart = () => {
      if (auth.currentUser) {
        const savedCart = localStorage.getItem(`cart_${auth.currentUser.uid}`);
        setCartCount(savedCart ? JSON.parse(savedCart).length : 0);
      } else {
        setCartCount(0);
      }
    };

    // 2. مراقبة طلبات المساعدة (القلب) لحظياً من Firebase
    let unsubscribeGrants = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, "volunteer_requests"),
          where("requesterId", "==", user.uid)
        );

        unsubscribeGrants = onSnapshot(q, (snapshot) => {
          setPendingGrantsCount(snapshot.size); 
        });
        updateCart();
      } else {
        setPendingGrantsCount(0);
        setCartCount(0);
        if (unsubscribeGrants) unsubscribeGrants();
      }
    });

    window.addEventListener("storage", updateCart);
    const interval = setInterval(updateCart, 1000); 

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", updateCart);
      unsubscribeAuth();
      if (unsubscribeGrants) unsubscribeGrants();
    };
  }, []);

  const handleLinkClick = (path, state = {}) => {
    const protectedPaths = ["/my-requests", "/seller-requests", "/my-product", "/AddOrder", "/all-requests"];
    if (protectedPaths.includes(path) && !role) {
      alert("Please login to access this page");
      navigate("/login");
    } else {
      navigate(path, { state });
    }
    setMenuOpen(false);
  };

  const handleLogout = () => {
    auth.signOut();
    setRole("");
    localStorage.removeItem("userRole");
    navigate("/login");
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    navigate("/", { state: { search: value } });
  };

  const isAdmin = role?.toLowerCase() === "admin";

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <h2 className="logo" onClick={() => navigate("/")}>CAMPUS.</h2>
            <div className="search-navbar">
              <span>🔍</span>
              <input
                type="text"
                placeholder=" Search products..."
                className="search-input-nav"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="nav-right">
            {/* تم إظهار الأيقونات للجميع (بما فيهم الأدمن) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              
              {/* أيقونة القلب */}
              <div 
                className="cart-icon-container" 
                onClick={() => navigate('/my-requests', { state: { activeTab: 'grants', fromHeart: true } })} 
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <span style={{ fontSize: '1.5rem' }}>❤️</span>
                {pendingGrantsCount > 0 && (
                  <span className="cart-badge" style={{ backgroundColor: '#10b981' }}>
                    {pendingGrantsCount}
                  </span>
                )}
              </div>

              {/* أيقونة السلة */}
              <div className="cart-icon-container" onClick={() => navigate('/cart')} style={{ cursor: 'pointer', position: 'relative' }}>
                <span style={{ fontSize: '1.5rem' }}>🛒</span>
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </div>
            </div>

            {role ? (
              <button className="login-btn" onClick={handleLogout}>Logout</button>
            ) : (
              <button className="login-btn" onClick={() => navigate("/login")}>Sign In</button>
            )}

            <button className="menu-toggle-btn" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>}

      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
        <div className="sidebar-content">
          <h3 className="sidebar-title">Menu</h3>
          
          {/* الروابط الأساسية تظهر للكل */}
          <div className="sidebar-item" onClick={() => handleLinkClick("/")}>Home</div>
          
          {/* يظهر خيار الأدمن فقط لو كان المستخدم Admin مع الاحتفاظ بالباقي */}
          {isAdmin && (
            <div className="sidebar-item" style={{ color: '#10b981', fontWeight: 'bold' }} onClick={() => handleLinkClick("/all-requests")}>
              Admin Dashboard
            </div>
          )}

          <div className="sidebar-item" onClick={() => handleLinkClick("/my-product")}>My Inventory</div>
          <div className="sidebar-item" onClick={() => handleLinkClick("/AddOrder")}>Post Item</div>
          <div className="sidebar-item" onClick={() => handleLinkClick("/my-requests", { activeTab: 'grants', fromHeart: false })}>My Grants</div>
          <div className="sidebar-item" onClick={() => handleLinkClick("/my-requests", { activeTab: 'orders' })}>My Orders</div>
          <div className="sidebar-item" onClick={() => handleLinkClick("/seller-requests")}>Seller Requests</div>
        </div>
      </div>
    </>
  );
}

export default Navbar;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // تأكدي من المسار صح
import "./Home.css";

function Navbar({ role, setRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0); // عداد السلة
  const navigate = useNavigate();

  // تحديث عداد السلة من localStorage بشكل مستمر
  useEffect(() => {
    const updateCart = () => {
      if (auth.currentUser) {
        const savedCart = localStorage.getItem(`cart_${auth.currentUser.uid}`);
        if (savedCart) {
          setCartCount(JSON.parse(savedCart).length);
        } else {
          setCartCount(0);
        }
      }
    };

    updateCart(); // تحديث أولي
    const interval = setInterval(updateCart, 1000); // تحديث كل ثانية عشان يحس بالإضافات الجديدة
    return () => clearInterval(interval);
  }, []);

  const handleLinkClick = (path) => {
    const protectedPaths = ["/my-requests", "/seller-requests", "/my-product", "/AddOrder", "/all-requests"];
    if (protectedPaths.includes(path) && !role) {
      alert("عفواً، يجب تسجيل الدخول للوصول إلى هذه الصفحة");
      navigate("/login");
    } else {
      navigate(path);
    }
    setMenuOpen(false);
  };

  const handleLogout = () => {
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

          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* أيقونة السلة جنب زرار الدخول/الخروج */}
            <div className="cart-icon-container" onClick={() => navigate('/cart')} style={{ cursor: 'pointer', position: 'relative' }}>
              <span style={{ fontSize: '1.5rem' }}>🛒</span>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
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
          {role?.toLowerCase() === "admin" && (
            <div className="sidebar-item" onClick={() => handleLinkClick("/all-requests")}>Admin Dashboard</div>
          )}
          <div className="sidebar-item" onClick={() => handleLinkClick("/my-product")}>My Inventory</div>
          <div className="sidebar-item" onClick={() => handleLinkClick("/AddOrder")}>Post Item</div>
          <div className="sidebar-item" onClick={() => handleLinkClick("/")}>Home</div>
          <div className="sidebar-item" onClick={() => handleLinkClick("/my-requests")}>My Requests</div>
          <div className="sidebar-item" onClick={() => handleLinkClick("/seller-requests")}>Seller Requests</div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
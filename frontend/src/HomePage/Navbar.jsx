import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Navbar({ role, setRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

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

  // 🔥 السيرش
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    navigate("/", { state: { search: value } });
  };

  let authButton = role ? (
    <button className="login-btn" onClick={handleLogout}>Logout</button>
  ) : (
    <button className="login-btn" onClick={() => navigate("/login")}>Sign In</button>
  );

  let menuIcon = menuOpen ? "✕" : "☰";
  let sidebarClass = menuOpen ? "sidebar open" : "sidebar";

  let adminItem = role && role.toLowerCase() === "admin" && (
    <div className="sidebar-item" onClick={() => handleLinkClick("/all-requests")}>
      Admin Dashboard
    </div>
  );

  let overlay = menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>;

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
            {authButton}
            <button className="menu-toggle-btn" onClick={() => setMenuOpen(!menuOpen)}>
              {menuIcon}
            </button>
          </div>

        </div>
      </nav>

      {overlay}

      <div className={sidebarClass}>
        <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>

        <div className="sidebar-content">
          <h3 className="sidebar-title">Menu</h3>

          {adminItem}

          <div className="sidebar-item" onClick={() => handleLinkClick("/my-product")}>
            My Inventory
          </div>

          <div className="sidebar-item" onClick={() => handleLinkClick("/AddOrder")}>
            Post Item
          </div>

          <div className="sidebar-item" onClick={() => handleLinkClick("/home")}>
            Home
          </div>

          <div className="sidebar-item" onClick={() => handleLinkClick("/my-requests")}>
            My Requests
          </div>

          <div className="sidebar-item" onClick={() => handleLinkClick("/seller-requests")}>
            Seller Requests
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
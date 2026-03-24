import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Navbar({ role, setRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLinkClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    setRole("");
    localStorage.removeItem("userRole");
    navigate("/login");
    setMenuOpen(false);
  };

  let authButton;
  if (role) {
    authButton = <button className="login-btn" onClick={handleLogout}>Logout</button>;
  } else {
    authButton = <button className="login-btn" onClick={() => navigate("/login")}>Sign In</button>;
  }

  let menuIcon;
  if (menuOpen) {
    menuIcon = "✕";
  } else {
    menuIcon = "☰";
  }

  let sidebarClass = "sidebar";
  if (menuOpen) {
    sidebarClass = "sidebar open";
  }

  let adminItem = null;
  if (role && role.toLowerCase() === "admin") {
    adminItem = (
      <div className="sidebar-item" onClick={() => handleLinkClick("/all-requests")}>
        Admin Dashboard
      </div>
    );
  }

  let overlay = null;
  if (menuOpen) {
    overlay = <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>;
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <h2 className="logo" onClick={() => navigate("/")}>CAMPUS.</h2>
            <div className="search-navbar">
              <span>🔍</span>
              <input type="text" placeholder="Search products..." className="search-input-nav" />
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
        </div>
      </div>
    </>
  );
}

export default Navbar;
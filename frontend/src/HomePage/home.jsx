import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home({ role }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="main-wrapper">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-left">
            <h2 className="logo" onClick={() => navigate("/")}>CAMPUS.</h2>
            <div className="search-navbar">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search products..."
                className="search-input-nav"
              />
            </div>
          </div>

          <div className="nav-right">
            <button className="login-btn" onClick={() => navigate("/login")}>
              Sign In
            </button>
            <button className="menu-toggle-btn" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="dropdown">
            {role === "Admin" && (
              <div className="dropdown-item" onClick={() => navigate("/all-requests")}>Admin Dashboard</div>
            )}
            <div className="dropdown-item" onClick={() => navigate("/my-product")}>My Inventory</div>
            <div className="dropdown-item" onClick={() => navigate("/AddOrder")}>Post Item</div>
          </div>
        )}
      </nav>

      <header className="hero">
        <h1 className="hero-title">Welcome to Campus Market</h1>
        <p className="hero-subtitle">
          The most trusted marketplace to buy and sell textbooks, electronics, and student essentials within your university community.
        </p>
      </header>
    </div>
  );
}

export default Home;
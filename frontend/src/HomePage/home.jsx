import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home({ role }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate(); 

  return (
    <div style={styles.page}>
      <style>{`
        body { margin: 0; padding: 0; display: block !important; background-color: white !important; }
        #root { width: 100%; }
      `}</style>

      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          <h2 style={styles.logo}>Campus Market</h2>

          <div style={styles.navRight}>
            <div style={styles.searchWrapper}>
              <span style={{ marginRight: "8px", color: "#666" }}>🔍</span>
              <input
                type="text"
                placeholder="Search products, services..."
                style={styles.search}
              />
            </div>

            <button style={styles.loginBtn} onClick={() => navigate("/login")}>
              Login
            </button>

            <button style={styles.menuIconBtn} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
  <div style={styles.dropdown}>
    {role === "Admin" && (
      <div
        style={styles.dropdownItem}
        onClick={() => navigate("/all-requests")}
      >
        All Requests
      </div>
    )}
    <div
      style={styles.dropdownItem}
      onClick={() => navigate("/my-product")}
    >
      My Product
    </div>
    <div
      style={styles.dropdownItem}
      onClick={() => navigate("/AddOrder")}
    >
      Add Product
    </div>
  </div>
)}
      </nav>

      <header style={styles.hero}>
        <h1 style={styles.heroTitle}>Welcome to Campus Market</h1>
        <p style={styles.heroSubtitle}>
          Your university marketplace for buying and selling textbooks, electronics, furniture, <br />
          and more. Connect with fellow students and find great deals.
        </p>
      </header>
    </div>
  );
}

const styles = {
  page: { width: "100%", minHeight: "100vh", backgroundColor: "white", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  navbar: { width: "100%", backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 0", position: "relative", zIndex: 1000 },
  navContainer: { maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px" },
  logo: { fontSize: "30px", fontWeight: "bold", margin: 0, color: "#0f172a", whiteSpace: "nowrap" },
  navRight: { display: "flex", alignItems: "center", gap: "10px" },
  searchWrapper: { backgroundColor: "#f3f4f6", padding: "6px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center" },
  search: { border: "none", background: "transparent", outline: "none", width: "280px", fontSize: "15px" },
  loginBtn: { backgroundColor: "#2563eb", color: "white", border: "none", padding: "8px 24px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "18px" },
  menuIconBtn: { fontSize: "18px", cursor: "pointer", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px", width: "50px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" },
  dropdown: { position: "absolute", top: "100%", right: "20px", marginTop: "8px", backgroundColor: "white", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", borderRadius: "8px", width: "200px", border: "1px solid #f3f4f6", overflow: "hidden", zIndex: 1001 },
  dropdownItem: { padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: "18px", fontWeight: "500", textAlign: "left" },
  hero: { textAlign: "center", padding: "80px 20px" },
  heroTitle: { fontSize: "36px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" },
  heroSubtitle: { color: "#64748b", fontSize: "20px", lineHeight: "1.6", fontWeight: "400" },
};

export default Home;
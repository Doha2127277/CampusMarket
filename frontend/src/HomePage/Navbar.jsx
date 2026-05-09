import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./Home.css";
import Fuse from "fuse.js";
import debounce from "lodash/debounce";
function Navbar({ role, setRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
const [search, setSearch] = useState("");
const [suggestions, setSuggestions] = useState([]);
const [activeCategory, setActiveCategory] = useState("All");
const [searchHistory, setSearchHistory] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0); 
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [pendingGrantsCount, setPendingGrantsCount] = useState(0); 
  const navigate = useNavigate();
useEffect(() => {
  const history = localStorage.getItem("searchHistory");
  if (history) setSearchHistory(JSON.parse(history));
}, []);

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
    const unsubscribeProducts = onSnapshot(
  collection(db, "products"),
  (snapshot) => {
    const arr = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setAllProducts(arr);
  }
);
    const interval = setInterval(updateCart, 1000); 

    return () => {
      unsubscribeProducts();
      clearInterval(interval);
      window.removeEventListener("storage", updateCart);
      unsubscribeAuth();
      if (unsubscribeGrants) unsubscribeGrants();
    };
  }, []);
const fuse = useMemo(
  () =>
    new Fuse(allProducts, {
      keys: ["name", "category", "description"],
      threshold: 0.35,
      includeScore: true,
    }),
  [allProducts]
);
const saveSearch = (q) => {
  if (!q.trim()) return;

  const updated = [
    q,
    ...searchHistory.filter(i => i.toLowerCase() !== q.toLowerCase())
  ].slice(0, 10);

  setSearchHistory(updated);
  localStorage.setItem("searchHistory", JSON.stringify(updated));
};
const applySearch = useCallback((text, category = "All") => {
  let results = allProducts;

  if (text.trim()) {
    results = fuse.search(text).map(r => r.item);
  }

  if (category !== "All") {
    results = results.filter(p => p.category === category);
  }

  setFilteredProducts(results);
}, [allProducts, fuse]);
const generateSuggestions = useCallback((text) => {
  if (!text.trim()) {
    setSuggestions(searchHistory);
    return;
  }

  const results = fuse
    .search(text)
    .slice(0, 5)
    .map(r => r.item.name);

  const historyMatches = searchHistory.filter(i =>
    i.toLowerCase().includes(text.toLowerCase())
  );

  setSuggestions([...new Set([...historyMatches, ...results])].slice(0, 6));
}, [fuse, searchHistory]);
// هنبعت الكلمة بس للـ Home مش المنتجات كلها
  const debouncedSearch = useMemo(() =>
    debounce((text) => {
      navigate("/", { state: { searchText: text } });
    }, 250),
    [navigate]
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    if (value.trim()) {
      saveSearch(value);
      generateSuggestions(value);
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      // لو مسح السيرش، نرجع نعرض كل حاجة
      navigate("/", { state: { searchText: "" } }); 
    }
  };

  const handleSuggestionPress = (item) => {
    setSearch(item);
    saveSearch(item);
    setSuggestions([]);
    navigate("/", { state: { searchText: item } });
  };
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
              onFocus={() => {
                 if(search.trim() === "" && searchHistory.length > 0) {
                     setSuggestions(searchHistory);
                 }
              }}
              />
              {suggestions.length > 0 && (
              <div className="search-suggestions-dropdown">
                {suggestions.map((item, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionPress(item)}
                  >
                    
                    {item}
                  </div>
                ))}
            </div>
            )}
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
              {/* Profile */}
{auth.currentUser && (
  <div
    onClick={() => navigate("/", { state: { openProfile: true } })}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer"
    }}
  >
    <span
      style={{
        fontSize: "15px",
        fontWeight: "600",
        color: "#ffffff",
        whiteSpace: "nowrap"
      }}
    >
      Hi, {auth.currentUser.displayName || "User"}
    </span>

    <img
      src={
        auth.currentUser.photoURL ||
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
      }
      alt="profile"
      style={{
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "2px solid #3b82f6"
      }}
    />
  </div>
)}

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
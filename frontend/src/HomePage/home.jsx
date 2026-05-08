import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc, getDocs, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, updatePassword, signOut, onAuthStateChanged } from "firebase/auth"; // دوال التحديث المضافة
import { useNavigate, useLocation } from "react-router-dom";
import './Home.css';

function Home() { 
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [volunteerRequests, setVolunteerRequests] = useState([]); 
    
    const [cart, setCart] = useState(() => {
        const user = auth.currentUser;
        const saved = user ? localStorage.getItem(`cart_${user.uid}`) : null;
        return saved ? JSON.parse(saved) : [];
    });

    const navigate = useNavigate();
    const location = useLocation();
    const categories = ["All", "Engineering", "Medicine", "Business"];

    // --- 1. حالات تعديل البروفايل (Profile States) ---
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [tempImageFile, setTempImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState("");
    const [updating, setUpdating] = useState(false);

    // تحديث بيانات المستخدم في الـ States فور توفرها
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setNewUserName(user.displayName || "");
                setPreviewImage(user.photoURL || "");
            }
        });
        return () => unsubscribe();
    }, []);

    // دالة رفع الصورة لـ Cloudinary
    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "CampusMarket"); 
        formData.append("folder", "CampusMarket/Profiles");
        const res = await fetch("https://api.cloudinary.com/v1_1/dmzp7e6zb/image/upload", {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        return data.secure_url;
    };

    // معالج تحديث البيانات
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (newPassword && newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        setUpdating(true);
        try {
            const user = auth.currentUser;
            let finalPhotoURL = user.photoURL;

            if (tempImageFile) {
                finalPhotoURL = await uploadToCloudinary(tempImageFile);
            }

            // تحديث Firestore
            await updateDoc(doc(db, "users", user.uid), {
                fullName: newUserName,
                photoURL: finalPhotoURL
            });

            // تحديث Auth
            await updateProfile(user, {
                displayName: newUserName,
                photoURL: finalPhotoURL
            });

            if (newPassword) {
                await updatePassword(user, newPassword);
            }

            alert("Profile updated! Please login again for security.");
            setProfileModalVisible(false);
            await signOut(auth);
            navigate("/login");
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setUpdating(false);
        }
    };

    // مراقبة الـ Navbar لفتح البروفايل
    useEffect(() => {
        if (location.state?.openProfile) {
            setProfileModalVisible(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // 2. جلب المنتجات (كودك الأصلي بدون تغيير)
    useEffect(() => {
        const q = query(collection(db, "products"), where("status", "==", "approved"));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const productsArray = [];
            for (const docSnapshot of querySnapshot.docs) {
                const data = docSnapshot.data();
                const isAvailable = data.isSold === false || data.isSold === undefined || !data.isSold;
                if (isAvailable) { 
                    const sellerId = data.userId || data.sellerId;
                    let rating = 5; let reviews = 0;
                    if (sellerId) {
                        try {
                            const sDoc = await getDoc(doc(db, "users", sellerId));
                            if (sDoc.exists()) {
                                rating = sDoc.data().rating || 5;
                                reviews = sDoc.data().totalReviews || 0;
                            }
                        } catch (err) { console.error("Error fetching seller data:", err); }
                    }
                    productsArray.push({ ...data, id: docSnapshot.id, sellerRating: rating, totalReviews: reviews });
                }
            }
            setProducts(productsArray);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 3. مراقبة طلبات التبرع (كودك الأصلي)
    useEffect(() => {
        if (auth.currentUser) {
            const q = query(collection(db, "volunteer_requests"), where("requesterId", "==", auth.currentUser.uid));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const ids = snapshot.docs.map(doc => String(doc.data().productId));
                setVolunteerRequests(ids);
            });
            return () => unsubscribe();
        }
    }, []);

    // 4. تحديث السلة عند تغيير المستخدم (كودك الأصلي)
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const savedCart = localStorage.getItem(`cart_${user.uid}`);
                setCart(savedCart ? JSON.parse(savedCart) : []);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 5. فلترة البحث والكاتيجوري (كودك الأصلي)
    useEffect(() => {
        let result = products;
        const searchFromNav = location.state?.search || "";
        if (activeCategory !== "All") result = result.filter(p => p.category === activeCategory);
        if (searchFromNav) {
            result = result.filter(p => p.name.toLowerCase().includes(searchFromNav.toLowerCase()));
        }
        setFilteredProducts(result);
    }, [products, activeCategory, location.state]);

    const handleVolunteerToggle = async (e, product) => {
        e.stopPropagation();
        if (!auth.currentUser) { navigate("/login"); return; }
        const q = query(collection(db, "volunteer_requests"), where("requesterId", "==", auth.currentUser.uid), where("productId", "==", product.id));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            await deleteDoc(doc(db, "volunteer_requests", snapshot.docs[0].id));
        } else {
            await addDoc(collection(db, "volunteer_requests"), {
                requesterId: auth.currentUser.uid,
                sellerId: product.userId || product.sellerId,
                productId: product.id,
                productName: product.name,
                status: "pending_admin",
                createdAt: serverTimestamp(),
            });
        }
    };

    const handleCartToggle = (e, product) => {
        e.stopPropagation();
        if (!auth.currentUser) { navigate("/login"); return; }
        const cartKey = `cart_${auth.currentUser.uid}`;
        const isInCart = cart.some(item => String(item.id) === String(product.id));
        let updatedCart;
        if (isInCart) {
            updatedCart = cart.filter(item => String(item.id) !== String(product.id));
        } else {
            updatedCart = [...cart, product];
        }
        setCart(updatedCart);
        localStorage.setItem(cartKey, JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("storage")); 
    };

    if (loading) return <div className="loading-state">Loading products...</div>;

    return (
        <div className="main-wrapper">
            <div className="home-container">
                <div className="filter-chips">
                    {categories.map(cat => (
                        <button key={cat} className={`chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
                    ))}
                </div>

                <div className="products-grid">
                    {filteredProducts.map((product) => {
                        const isFree = Number(product.price) === 0;
                        const isInCart = cart.some(item => String(item.id) === String(product.id));
                        const isRequested = volunteerRequests.some(id => String(id) === String(product.id));
                        const isMine = auth.currentUser && (product.userId === auth.currentUser.uid || product.sellerId === auth.currentUser.uid);
                        const isAdded = isFree ? isRequested : isInCart;
                        const buttonText = isMine ? "Your Product" : (isAdded ? "Remove" : "Add");
                        const buttonColor = isMine ? "#94a3b8" : (isAdded ? "#ef4444" : "#10b981");
                        const icon = isMine ? "✨" : (isFree ? "❤️" : "🛒");

                        return (
                            <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                                <img src={product.photoURL} alt="" className="product-image" />
                                <div className="product-info">
                                    <div className="product-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 className="product-name">{product.name}</h3>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="product-price" style={{ display: 'block' }}>{isFree ? "Free" : `${product.price} EGP`}</span>
                                            <div style={{ fontSize: '15px', color: '#f59e0b', marginTop: '2px', fontWeight: 'bold' }}>
                                                ⭐{product.sellerRating?.toFixed(1) || "5.0"} 
                                                <span style={{ color: '#888', marginLeft: '2px', fontSize: '11px' }}>({product.totalReviews || 0})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-actions-row">
                                        <button 
                                            className="cart-action-btn"
                                            disabled={isMine}
                                            style={{ backgroundColor: buttonColor, color: 'white', border: 'none', padding: '10px 12px', borderRadius: '10px', cursor: isMine ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold', transition: '0.3s', opacity: isMine ? 0.7 : 1 }} 
                                            onClick={(e) => { if (isMine) return; isFree ? handleVolunteerToggle(e, product) : handleCartToggle(e, product) }}
                                        >
                                            {buttonText} {icon}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {filteredProducts.length === 0 && (
                    <div style={{textAlign: 'center', marginTop: '50px', color: '#666'}}>No products available right now.</div>
                )}
            </div>

            {/* --- المودال المضاف (تعديل البروفايل) --- */}
            {profileModalVisible && (
                <div className="modal-overlay">
                    <div className="profile-modal">
                        <div className="modal-header">
                            <h2>Edit Profile</h2>
                            <button className="close-btn" onClick={() => setProfileModalVisible(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="avatar-picker-web">
                                <img src={previewImage || "https://via.placeholder.com/150"} alt="Profile" />
                                <label htmlFor="imgInput" className="edit-icon-web">📷</label>
                                <input id="imgInput" type="file" accept="image/*" hidden onChange={(e) => {
                                    const file = e.target.files[0];
                                    if(file) {
                                        setTempImageFile(file);
                                        setPreviewImage(URL.createObjectURL(file));
                                    }
                                }} />
                            </div>
                            <div className="web-input-group">
                                <label>Full Name</label>
                                <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                            </div>
                            <div className="web-input-group">
                                <label>New Password</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep same" />
                            </div>
                            <button className="save-btn-web" type="submit" disabled={updating}>
                                {updating ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc, getDocs, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile, updatePassword, signOut, onAuthStateChanged } from "firebase/auth"; 
import { useNavigate, useLocation } from "react-router-dom";
import './Home.css';
import Fuse from "fuse.js";

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
    const [passwordsMatch, setPasswordsMatch] = useState(true);
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

    // مراقبة تطابق الباسورد لحظياً
    useEffect(() => {
        if (confirmPassword && newPassword !== confirmPassword) {
            setPasswordsMatch(false);
        } else {
            setPasswordsMatch(true);
        }
    }, [newPassword, confirmPassword]);

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
    const handleUpdateProfile = async () => {
        if (newPassword && newPassword !== confirmPassword) {
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

            window.alert("Profile Updated Successfully! ✅\nPlease login again to apply changes.");
            setProfileModalVisible(false);
            await signOut(auth);
            localStorage.clear();
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

    // 2. جلب المنتجات 
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

    // 3. مراقبة طلبات التبرع 
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

    // 4. تحديث السلة عند تغيير المستخدم 
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const savedCart = localStorage.getItem(`cart_${user.uid}`);
                setCart(savedCart ? JSON.parse(savedCart) : []);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 5. فلترة البحث والكاتيجوري 
   // 5. فلترة البحث والكاتيجوري مع بعض
    useEffect(() => {
        let result = products;

        // 1. تطبيق فلتر البحث الأول لو اليوزر كاتب حاجة في الـ Navbar
        const searchText = location.state?.searchText;
        if (searchText && searchText.trim() !== "") {
            const fuse = new Fuse(result, {
                keys: ["name", "category", "description"],
                threshold: 0.35,
            });
            result = fuse.search(searchText).map(r => r.item);
        }

        // 2. تطبيق فلتر الكاتيجوري على نتايج البحث
        if (activeCategory !== "All") {
            result = result.filter(p => p.category === activeCategory);
        }

        setFilteredProducts(result);
    }, [products, activeCategory, location.state?.searchText]);

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

            {/* --- المودال --- */}
            {profileModalVisible && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '360px', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>Edit Profile</h2>
                        
                        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 25px' }}>
                            <img 
                                src={previewImage || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3b82f6' }} 
                            />
                            <label style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#3b82f6', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
                                <span style={{fontSize: '14px'}}>📷</span>
                                <input type="file" accept="image/*" hidden onChange={(e) => {
                                    const file = e.target.files[0];
                                    if(file) {
                                        setTempImageFile(file);
                                        setPreviewImage(URL.createObjectURL(file));
                                    }
                                }} />
                            </label>
                        </div>

                        <input type="text" placeholder="Full Name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }} required />
                        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }} />
                        
                        <div style={{ marginBottom: '20px' }}>
                            <input 
                                type="password" placeholder="Confirm Password" value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', borderColor: !passwordsMatch ? '#ef4444' : '#e2e8f0' }}
                            />
                            {!passwordsMatch && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', textAlign: 'left', marginLeft: '5px' }}>Passwords do not match</p>}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setProfileModalVisible(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleUpdateProfile} disabled={updating || !passwordsMatch} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: (!passwordsMatch || updating) ? '#94a3b8' : '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                                {updating ? "Saving..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
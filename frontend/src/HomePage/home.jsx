import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc, getDocs, serverTimestamp } from "firebase/firestore";
import { updateProfile, updatePassword, signOut } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import './Home.css';

function Home() { 
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    
    const [cart, setCart] = useState(() => {
        const user = auth.currentUser;
        const saved = user ? localStorage.getItem(`cart_${user.uid}`) : null;
        return saved ? JSON.parse(saved) : [];
    });

    // --- Profile State ---
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [selectedImage, setSelectedImage] = useState(null); 
    const [tempImageFile, setTempImageFile] = useState(null); 
    const [tempImagePreview, setTempImagePreview] = useState(null); 
    const [updating, setUpdating] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const categories = ["All", "Engineering", "Medicine", "Business"];

    // 1. الرابط السحري: مراقبة الضغط على الصورة في الـ Navbar
    useEffect(() => {
        if (location.state?.openProfile) {
            setProfileModalVisible(true);
            // تصفير الحالة عشان المودال يفتح مرة واحدة بس عند الضغط
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // 2. جلب المنتجات
    useEffect(() => {
        const q = query(collection(db, "products"), where("status", "==", "approved"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const productsArray = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.isSold) productsArray.push({ ...data, id: doc.id });
            });
            setProducts(productsArray);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 3. تحديث بيانات المستخدم
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setNewUserName(user.displayName || "");
                setSelectedImage(user.photoURL || "");
                const savedCart = localStorage.getItem(`cart_${user.uid}`);
                setCart(savedCart ? JSON.parse(savedCart) : []);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 4. فلترة البحث والكاتيجوري
    useEffect(() => {
        let result = products;
        const searchFromNav = location.state?.search || "";
        if (activeCategory !== "All") result = result.filter(p => p.category === activeCategory);
        if (searchFromNav) {
            result = result.filter(p => p.name.toLowerCase().includes(searchFromNav.toLowerCase()));
        }
        setFilteredProducts(result);
    }, [products, activeCategory, location.state]);

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "CampusMarket");
        const res = await fetch("https://api.cloudinary.com/v1_1/dmzp7e6zb/image/upload", { method: "POST", body: formData });
        const data = await res.json();
        return data.secure_url;
    };

    const handleUpdateProfile = async () => {
        if (newPassword && newPassword !== confirmPassword) {
            window.alert("Not match");
            return;
        }
        setUpdating(true);
        try {
            const user = auth.currentUser;
            let newPhotoURL = selectedImage;
            if (tempImageFile) newPhotoURL = await uploadToCloudinary(tempImageFile);

            await updateProfile(user, { displayName: newUserName, photoURL: newPhotoURL });
            if (newPassword) await updatePassword(user, newPassword);

            window.alert("Your profile has been updated successfully! Please login again to see the changes.");
            await signOut(auth);
            localStorage.clear();
            navigate("/login");
        } catch (error) {
            window.alert("Error: " + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleVolunteerToggle = async (e, product) => {
        e.stopPropagation();
        if (!auth.currentUser) { navigate("/login"); return; }
        const existingQuery = query(collection(db, "volunteer_requests"), where("requesterId", "==", auth.currentUser.uid), where("productId", "==", product.id));
        const snapshot = await getDocs(existingQuery);
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
        let updatedCart = isInCart ? cart.filter(item => String(item.id) !== String(product.id)) : [...cart, product];
        setCart(updatedCart);
        localStorage.setItem(cartKey, JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("storage")); 
    };

    if (loading) return <div className="loading-state">Loading...</div>;

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
                        return (
                            <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                                <img src={product.photoURL} alt="" className="product-image" />
                                <div className="product-info">
                                    <div className="product-header">
                                        <h3 className="product-name">{product.name}</h3>
                                        <span className="product-price">{isFree ? "Free" : `${product.price} EGP`}</span>
                                    </div>
                                    <div className="card-actions-row">
                                        <button 
                                            className="cart-action-btn"
                                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
                                            onClick={(e) => isFree ? handleVolunteerToggle(e, product) : handleCartToggle(e, product)}
                                        >
                                            {isFree ? "Add ❤️" : "Add 🛒"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- Modal تعديل البروفايل --- */}
            {profileModalVisible && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
                    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '360px', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>Edit Profile</h2>
                        
                        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 25px' }}>
                            <img 
                                src={tempImagePreview || selectedImage || "https://via.placeholder.com/100"} 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3b82f6' }} 
                            />
                            <label style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#3b82f6', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
                                <span style={{fontSize: '14px'}}>📷</span>
                                <input type="file" accept="image/*" hidden onChange={(e) => { setTempImageFile(e.target.files[0]); setTempImagePreview(URL.createObjectURL(e.target.files[0])); }} />
                            </label>
                        </div>

                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            value={newUserName} 
                            onChange={(e) => setNewUserName(e.target.value)} 
                            style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                        />
                        
                        <input 
                            type="password" 
                            placeholder="New Password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                        />

                        <input 
                            type="password" 
                            placeholder="Confirm Password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            style={{ width: '100%', padding: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setProfileModalVisible(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleUpdateProfile} disabled={updating} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
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
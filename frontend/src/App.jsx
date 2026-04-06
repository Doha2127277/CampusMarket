import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './HomePage/Navbar'; 
import LoginPage from './LoginPage/LoginPage';
import Register from './RigsterPage/Rigster';
import ForgetPassword from './pages/forgetPass/ForgetPassword';
import Home from './HomePage/home.jsx';
import AddOrder from './AddOrder/AddOrder.jsx';
import MyProducts from './myProduct/myProducts.jsx';
import AllRequests from './Admin/AllRequests.jsx';
import ProductDetails from './HomePage/ProductDetails.jsx'; 
import MyRequests from './myRequestPage/MyRequests.jsx';
import SellerRequests from './sellerRequestpage/SellerRequests.jsx';

function App() {
  const [role, setRole] = useState(localStorage.getItem("userRole") || "");

  // ✅ السيرش global
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (role) {
      localStorage.setItem("userRole", role);
    } else {
      localStorage.removeItem("userRole");
    }
  }, [role]);

  return (
    <Router>
      {/* نبعت السيرش للنافبار */}
      <Navbar 
        role={role} 
        setRole={setRole} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <Routes>
        <Route path="/" element={<Home role={role} searchQuery={searchQuery} />} />
        <Route path="/login" element={<LoginPage setRole={setRole} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/home" element={<Home role={role} searchQuery={searchQuery} />} />
        <Route path="/AddOrder" element={<AddOrder />} />
        <Route path="/my-product" element={<MyProducts />} />
        <Route path="/all-requests" element={<AllRequests />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/seller-requests" element={<SellerRequests />} />
        <Route path="/product/:id" element={<ProductDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
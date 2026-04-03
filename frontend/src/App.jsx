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

function App() {
  const [role, setRole] = useState(localStorage.getItem("userRole") || "");

  useEffect(() => {
    if (role) {
      localStorage.setItem("userRole", role);
    } else {
      localStorage.removeItem("userRole");
    }
  }, [role]);

  return (
    <Router>
      <Navbar role={role} setRole={setRole} />
      <Routes>
        <Route path="/" element={<Home role={role} />} />
        <Route path="/login" element={<LoginPage setRole={setRole} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/home" element={<Home role={role} />} />
        <Route path="/AddOrder" element={<AddOrder />} />
        <Route path="/my-product" element={<MyProducts />} />
        <Route path="/all-requests" element={<AllRequests />} />
        
        {}
        <Route path="/product/:id" element={<ProductDetails />} />
        
      </Routes>
    </Router>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage/LoginPage';
import Register from './RigsterPage/Rigster'; 
import ForgetPassword from './pages/forgetPass/ForgetPassword';
import Home from './HomePage/home.jsx';
import AddOrder from './AddOrder/AddOrder.jsx';
import MyProducts from './myProduct/myProducts.jsx';
import AllRequests from './Admin/AllRequests.jsx';

function App() {
  const role = "Admin";

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home role={role} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/home" element={<Home role={role} />} />
        <Route path="/AddOrder" element={<AddOrder />} />
        <Route path="/my-product" element={<MyProducts />} />
        <Route path="/all-requests" element={<AllRequests />} />
      </Routes>
    </Router>
  );
}

export default App;
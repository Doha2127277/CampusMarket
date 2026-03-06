import AllRequests from './Admin/AllRequests';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage/LoginPage';
import Register from './RigsterPage/Rigster'; 
import ForgetPassword from './pages/forgetPass/ForgetPassword';
import AddOrder from './AddOrder/AddOrder';
import MyProducts from "./MyProducts";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/all-requests" element={<AllRequests />} />
        <Route path="/add-product" element={<AddOrder />} />
        <Route path="/myproducts" element={<MyProducts />} />
      </Routes>
    </Router>
  );
}

export default App;

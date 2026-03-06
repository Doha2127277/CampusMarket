import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage/LoginPage';
import Register from './RigsterPage/Rigster'; 
import ForgetPassword from './pages/forgetPass/ForgetPassword';
import Home from './HomePage/home.jsx';

function App() {

  const role = "Admin";

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />

        {}
        <Route path="/home" element={<Home role={role} />} />

      </Routes>
    </Router>
  );
}

export default App;
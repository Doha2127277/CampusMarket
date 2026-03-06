import React, { useState } from 'react';
import { auth, db } from "../firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import './LogIn.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        if (!(email.endsWith(".edu") || email.endsWith(".edu.eg"))) {
            setErrorMsg("Please use your university email (.edu or .edu.eg)");
            return;
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                setErrorMsg("User data not found in Firestore");
                return;
            }
            const userData = userDoc.data();

            // حفظ البيانات المهمة في Local Storage
            localStorage.setItem("user", JSON.stringify({
                uid: user.uid,
                email: user.email,
                fullName: userData.fullName,
                role: userData.role
            }));

            alert("Login Successful!");
            navigate("/");
        } catch (error) {
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                setErrorMsg("Invalid email or password");
            } else {
                setErrorMsg(error.message);
            }
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h1>Login to Campus Market</h1>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter university email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {errorMsg && <p style={{ color: 'red', fontSize: '14px' }}>{errorMsg}</p>}
                    <button type="submit" className="login-btn">Login</button>
                </form>

                <div className="links">
                    <Link to="/forget-password">Forgot Password?</Link>
                    <Link to="/register">Create an Account</Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
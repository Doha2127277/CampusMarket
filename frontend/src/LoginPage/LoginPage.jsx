import React, { useState } from 'react';
import { auth, db } from "../firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import './LogIn.css';

function LoginPage({ setRole }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userRole = userDoc.data().role;
                setRole(userRole);
                navigate("/home"); 
            } else {
                setErrorMsg("User data not found.");
            }
        } catch {
            setErrorMsg("Invalid email or password. Please try again.");
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h1>Login to Campus Market</h1>
                
                {errorMsg && <div className="error-text">{errorMsg}</div>}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="e.g. name@std.sci.cu.edu.eg"
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

                    <button type="submit" className="login-btn">Login</button>
                </form>

                <div className="links">
                    <Link to="/forget-password">Forgot Password?</Link>
                    <Link to="/register">Don't have an account? Create one</Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
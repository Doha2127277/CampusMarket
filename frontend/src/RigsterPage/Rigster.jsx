// Register.jsx
import React, { useState } from "react";
import { auth, db } from "../firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import "./Rigister.css";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName || !email || !password) {
      setErrorMsg("Please fill all required fields!");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    if (!(email.endsWith(".edu") || email.endsWith(".edu.eg"))) {
      setErrorMsg("Please use your university email (.edu or .edu.eg)");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName,
        email: email,
        role: "user",
        createdAt: serverTimestamp()
      });
      setSuccessMsg("Account created successfully");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

      // // reset form
      // setFullName("");
      // setEmail("");
      // setPassword("");
      // setConfirmPassword("");
      // setRole("Choose");
      // setSellerRole("Choose");
      // setBuyerRole("Choose");
    } catch{
      setErrorMsg("this email already in use");
    }
  };

  return (
  <div className="register-page">
    <div className="form-container">
      <h2>Campus Market</h2>
      <p className="subtitle">Join our university community today</p>
      
      <form onSubmit={handleSubmit}>
        <input 
          placeholder="Full Name" 
          type="text" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
        />
        <input 
          placeholder="University Email (.edu.eg)" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          placeholder="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <input 
          placeholder="Confirm Password" 
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
        />

        {errorMsg && <p className="error">{errorMsg}</p>}
        {successMsg && <p className="success">{successMsg}</p>}

        <button type="submit">Create Account</button>
      </form>
    </div>
  </div>
);
}
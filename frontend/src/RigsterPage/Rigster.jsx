// Register.jsx
import React, { useState } from "react";
import { auth } from "../firebase.js"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import "./Rigister.css";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Choose");
  const [sellerRole, setSellerRole] = useState("Choose");
  const [buyerRole, setBuyerRole] = useState("Choose");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName || !email || !password || role === "Choose") {
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
      console.log("User registered:", user.email, fullName, role, role === "seller" ? sellerRole : buyerRole);
      setSuccessMsg("Registration Successful! You can login now.");

      // reset form
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("Choose");
      setSellerRole("Choose");
      setBuyerRole("Choose");
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Campus Market and Volunteer</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full Name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <br />
        <input placeholder="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <br />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <br />
        <input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <br />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Choose">Choose Seller or Buyer</option>
          <option value="seller">Seller</option>
          <option value="buyer">Buyer</option>
        </select>
        <br /><br />

        {role === "seller" && (
          <select value={sellerRole} onChange={(e) => setSellerRole(e.target.value)}>
            <option value="Choose">Choose Seller Type</option>
            <option value="normal">Normal Seller</option>
            <option value="volunteer">Volunteer</option>
          </select>
        )}

        {role === "buyer" && (
          <select value={buyerRole} onChange={(e) => setBuyerRole(e.target.value)}>
            <option value="Choose">Choose Buyer Type</option>
            <option value="no">Normal</option>
            <option value="yes">inNeed</option>
          </select>
        )}

        <br /><br />
        {errorMsg && <p className="error">{errorMsg}</p>}
        {successMsg && <p className="success">{successMsg}</p>}

        <button type="submit">Register</button>
      </form>
    </div>
  );
}
import { useState } from "react";
import "./projectSoft.css";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../firebase.js";
import bgImage from "./image copy 2.png";
import {  collection, query, where, getDocs } from "firebase/firestore";

export default function ForgetPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSendCode = async () => {
    setEmailError("");
    setSuccessMsg("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError("Please Enter Your Email");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setEmailError("Invalid email format");
      return;
    }

    const parts = trimmedEmail.split("@");
    if (parts.length !== 2) {
      setEmailError("Invalid email format");
      return;
    }

    const domain = parts[1];
    const blocked = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

    if (blocked.includes(domain)) {
      setEmailError("Public emails are not allowed");
      return;
    }

    if (!(domain.endsWith(".edu") || domain.endsWith(".edu.eg"))) {
      setEmailError("Use university email (.edu)");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", trimmedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setEmailError("No account found with this email");
        return;
      }
      const userDoc = querySnapshot.docs[0]; 
      console.log("User data:", userDoc.data());

      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccessMsg("Reset link sent to your email ");
      setStep(2);
    } catch (error) {
      setEmailError(error.message);
    }
  };

  return (
    <div>
      <img src={bgImage} alt="" />
      <div className="forgetPass">
        {step === 1 && (
          <>
            <p>
              <b>Please Enter university email and we will send you a reset link.</b>
            </p>
            <input
              type="email"
              placeholder="example@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="error">{emailError}</p>
            <button onClick={handleSendCode}>Get Reset Link</button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="success">{successMsg}</p>
            <a href="/">Back to Login</a>
          </>
        )}
      </div>
    </div>
  );
}

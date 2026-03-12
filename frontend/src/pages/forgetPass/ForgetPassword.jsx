import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../../firebase.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import "./ForgetPassword.css";

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

    if (!(trimmedEmail.endsWith(".edu") || trimmedEmail.endsWith(".edu.eg"))) {
      setEmailError("Please use your university email (.edu.eg)");
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

      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccessMsg("A reset link has been sent to your university email.");
      setStep(2);
    } catch {
      setEmailError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="forget-page">
      <div className="forget-card">
        <h2>Reset Password</h2>
        
        {step === 1 && (
          <>
            <p>
              Enter your university email address and we'll send you a link to reset your password.
            </p>
            
            <div className="input-group">
              <input
                type="email"
                placeholder="name@std.sci.cu.edu.eg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {emailError && <div className="error-text">{emailError}</div>}
            
            <button onClick={handleSendCode} className="action-btn">
              Send Reset Link
            </button>
            
            <Link to="/login" className="back-link">
              Back to Login
            </Link>
          </>
        )}

        {step === 2 && (
          <>
            <div className="success-text">{successMsg}</div>
            <p style={{ marginTop: '20px' }}>
              Please check your inbox and follow the instructions to recover your account.
            </p>
            <Link to="/login" className="back-link">
              Return to Login Page
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
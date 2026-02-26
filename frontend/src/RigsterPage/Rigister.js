// Register.js
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";

const form = document.getElementById("rigesterForm");
const fullNameInput = form.querySelector('input[type="text"]');
const emailInput = form.querySelector('input[type="email"]');
const passwordInput = form.querySelectorAll('input[type="password"]')[0];
const confirmPasswordInput = form.querySelectorAll('input[type="password"]')[1];
const roleSelect = document.getElementById("mainRole");

const sellerOptionDiv = document.getElementById("sellerOption");
const sellerRoleSelect = document.getElementById("sellerRole");
const buyerOptionDiv = document.getElementById("buyerOption");
const buyerRoleSelect = document.getElementById("buyerType");

roleSelect.addEventListener("change", () => {
    if(roleSelect.value === "seller"){
        sellerOptionDiv.classList.remove("hidden");
        buyerOptionDiv.classList.add("hidden");
    } else if(roleSelect.value === "buyer"){
        buyerOptionDiv.classList.remove("hidden");
        sellerOptionDiv.classList.add("hidden");
    } else {
        sellerOptionDiv.classList.add("hidden");
        buyerOptionDiv.classList.add("hidden");
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault(); 


    console.log("JS شغال!");
    
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const role = roleSelect.value;
    const sellerRole = sellerRoleSelect.value;
    const buyerRole = buyerRoleSelect.value;

    if(password !== confirmPassword){
        alert("Passwords do not match");
        return;
    }

    if(!fullName || !email || !password || role === "Choose"){
        alert("Please fill all required fields!");
        return;
    }

    if(!(email.endsWith(".edu") || email.endsWith(".edu.eg"))){
        alert("Please use your university email (.edu or .edu.eg)");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User registered:", user.email, fullName, role, role === "seller" ? sellerRole : buyerRole);

        alert("Registration Successful! You can login now.");
        window.location.href = "./LoginPage/LogIn.html"; 
    } catch(error) {
        alert(error.message);
    }
});
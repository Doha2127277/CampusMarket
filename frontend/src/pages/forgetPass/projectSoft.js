const StepOne =document.getElementById("StepOne");
const StepTwo =document.getElementById("StepTwo");
const StepThree =document.getElementById("StepThree");
const emailInp=document.getElementById("email");
const CodeInp=document.getElementById("code");
const passInp=document.getElementById("password");
const ConfPassInp=document.getElementById("ConfirmPassword");

const emailErr=document.getElementById("emailError");
const codeErr=document.getElementById("CodeError");
const passErr=document.getElementById("passError");
const succMsg =document.getElementById("successMsg");

const getCodeB=document.getElementById("send-code");
const verifyCodeB=document.getElementById("verifyCod");
const resetPassB=document.getElementById("resetPassB");
const backLogin = document.getElementById("backLogin");


let generatedCode=" ";

getCodeB.addEventListener("click", function () {

    emailErr.textContent = "";
    const email = emailInp.value.trim().toLowerCase();

    if (email === "") {
        emailErr.textContent = "Please Enter Your Email";
        return;
    }

   
    if (!email.includes("@")) {
        emailErr.textContent = "Invalid email format";
        return;
    }

    const parts = email.split("@");

    if (parts.length !== 2) {
        emailErr.textContent = "Invalid email format";
        return;
    }

    const domain = parts[1];

    const blocked = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

    if (blocked.includes(domain)) {
        emailErr.textContent = "Public emails are not allowed";
        return;
    }

    if (!(domain.endsWith(".edu") || domain.endsWith(".edu.eg"))) {
        emailErr.textContent = "Use university email (.edu)";
        return;
    }


    generatedCode = "123456";
    console.log("Verification Code:", generatedCode);

    StepOne.classList.add("hidden");
    StepTwo.classList.remove("hidden");
    Title.classList.add("hidden");
});


verifyCodeB.addEventListener("click" ,function(){
    codeErr.textContent=" ";
    if(CodeInp.value===""){
        codeErr.textContent="Please enter verification code";
        return;
    }
    if(CodeInp.value!==generatedCode){
        codeErr.textContent="Wrong verification code ";
        return;
    }
    StepTwo.classList.add("hidden");
    StepThree.classList.remove("hidden");
    

})

resetPassB.addEventListener("click" ,function(){
passErr.textContent="";
succMsg.textContent="";
if(passInp.value==="" || ConfPassInp.value===""){
    passErr.textContent="Please Fill all Field";
    return;
}
if(passInp.value!==ConfPassInp.value){
    passErr.textContent="Password and Condirm Password not match";
    
    return;
}
StepThree.classList.add("hidden"); 
    succMsg.textContent = "Password Reset successfully";
   backLogin.classList.remove("hidden");
     



})










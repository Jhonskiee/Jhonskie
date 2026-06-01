import { app } from "./firebase.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth(app);

window.registerUser = async function () {

    const email =
    document.getElementById("email").value;

    const password =
    document.getElementById("password").value;

    try {

        const userCredential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        await sendEmailVerification(
            userCredential.user
        );

        alert(
            "Account created. Verify your email."
        );

        window.location.href =
        "login.html";

    } catch(error){

        alert(error.message);

    }

};

window.loginUser = async function(){

    const email =
    document.getElementById("email").value;

    const password =
    document.getElementById("password").value;

    try{

        const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        if(
            !userCredential.user
            .emailVerified
        ){

            alert(
            "Verify your email first."
            );

            return;
        }

        window.location.href =
        "index.html";

    }catch(error){

        alert(error.message);

    }

};

window.resetPassword =
async function(){

    const email =
    document.getElementById("email").value;

    try{

        await sendPasswordResetEmail(
            auth,
            email
        );

        alert(
        "Password reset email sent."
        );

    }catch(error){

        alert(error.message);

    }

};

window.logoutUser =
function(){

    signOut(auth);

};

onAuthStateChanged(
    auth,
    (user)=>{

        if(
            window.location.pathname
            .includes("index.html")
            ||
            window.location.pathname
            === "/"
        ){

            if(!user){

                window.location.href =
                "login.html";

            }

        }

    }
);

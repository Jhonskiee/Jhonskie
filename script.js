import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA4F9GnvJZ-AGzID63vqQO79zJulh2NJmY",
    authDomain: "abcs-5859c.firebaseapp.com",
    databaseURL: "https://abcs-5859c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "abcs-5859c",
    storageBucket: "abcs-5859c.firebasestorage.app",
    messagingSenderId: "479969126573",
    appId: "1:479969126573:web:26bdd9ff755a92615afe24",
    measurementId: "G-KTV3112JXN"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.register = function () {
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

createUserWithEmailAndPassword(auth, email, password)
.then(() => {
alert("Account Created!");
})
.catch(error => {
alert(error.message);
});
};

window.login = function () {
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

signInWithEmailAndPassword(auth, email, password)
.catch(error => {
alert(error.message);
});
};

window.logout = function () {
signOut(auth);
};

onAuthStateChanged(auth, user => {
if(user){
document.getElementById("loginPage").style.display="none";
document.getElementById("homePage").style.display="block";
document.getElementById("userEmail").textContent=user.email;
}
else{
document.getElementById("loginPage").style.display="flex";
document.getElementById("homePage").style.display="none";
}
});

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

export const firebaseConfig = {
    apiKey: "AIzaSyA4F9GnvJZ-AGzID63vqQO79zJulh2NJmY",
    authDomain: "abcs-5859c.firebaseapp.com",
    databaseURL: "https://abcs-5859c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "abcs-5859c",
    storageBucket: "abcs-5859c.firebasestorage.app",
    messagingSenderId: "479969126573",
    appId: "1:479969126573:web:26bdd9ff755a92615afe24",
    measurementId: "G-KTV3112JXN"
};

export const app = initializeApp(firebaseConfig);

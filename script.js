import { app } from "./firebase.js";

import {
getAuth,
onAuthStateChanged,
signOut
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
getFirestore,
collection,
addDoc,
serverTimestamp,
query,
orderBy,
onSnapshot
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

window.logout = function(){
signOut(auth);
};

window.createPost = async function(){

const text =
document.getElementById("postInput").value;

if(text === "") return;

await addDoc(collection(db,"posts"),{

user:auth.currentUser.email,
text:text,
createdAt:serverTimestamp()

});

document.getElementById("postInput").value="";
};

onAuthStateChanged(auth,(user)=>{

if(user){

document.getElementById("username")
.textContent=user.email;

loadPosts();

}else{

window.location.href="pages/login.html";

}

});

function loadPosts(){

const q=query(
collection(db,"posts"),
orderBy("createdAt","desc")
);

onSnapshot(q,(snapshot)=>{

const posts=document.getElementById("posts");

posts.innerHTML="";

snapshot.forEach((doc)=>{

const data=doc.data();

posts.innerHTML+=`

<div class="post">

<div class="post-header">

<img class="avatar"
src="assets/default-avatar.png">

<b>${data.user}</b>

</div>

<p>${data.text}</p>

</div>

`;

});

});

}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot, serverTimestamp, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBc-ie4WnBkVMfrb5halHIaKWHGyy3zGC4",
    authDomain: "website-ab5ea.firebaseapp.com",
    projectId: "website-ab5ea",
    storageBucket: "website-ab5ea.firebasestorage.app",
    messagingSenderId: "1094491609955",
    appId: "1:1094491609955:web:4ac93d44c03490cd3d5156"
  };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;

// ===== SHOW/HIDE =====
window.showRegister = ()=>{loginForm.style.display="none";registerForm.style.display="block";}
window.showLogin = ()=>{loginForm.style.display="block";registerForm.style.display="none";}

// ===== AUTH =====
window.register = async ()=>{
  if(!regName.value||!regEmail.value||!regPassword.value) return alert("Fill all fields");
  const cred = await createUserWithEmailAndPassword(auth,regEmail.value,regPassword.value);
  await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,name:regName.value,email:regEmail.value,bio:"",profilePic:"",friends:[],requests:[],createdAt:serverTimestamp()});
}
window.login = async ()=>{await signInWithEmailAndPassword(auth,loginEmail.value,loginPassword.value);}
window.logout = ()=>signOut(auth);
window.forgotPassword = async ()=>{
  const email = prompt("Enter email for reset");
  if(!email)return;
  await sendPasswordResetEmail(auth,email);
  alert("Check your email for reset link");
}

// ===== AUTH STATE =====
onAuthStateChanged(auth,user=>{
  if(user){
    currentUser=user;
    authPage.style.display="none";
    homePage.style.display="block";
    loadProfile();
    loadFeed();
    loadStories();
    loadChat();
  }else{
    authPage.style.display="flex";
    homePage.style.display="none";
  }
});

// ===== PROFILE =====
profileUpload.onchange=async e=>{
  const file=e.target.files[0];
  const fileRef=ref(storage,"profiles/"+currentUser.uid);
  await uploadBytes(fileRef,file);
  const url=await getDownloadURL(fileRef);
  await setDoc(doc(db,"users",currentUser.uid),{profilePic:url},{merge:true});
}
window.updateProfile=async()=>{await setDoc(doc(db,"users",currentUser.uid),{bio:bio.value},{merge:true}); alert("Profile updated");}
function loadProfile(){
  onSnapshot(doc(db,"users",currentUser.uid),snap=>{
    const data=snap.data();
    profilePic.src=data.profilePic||"";
    bio.value=data.bio||"";
    welcomeUser.innerText=data.name;
  });
}

// ===== POSTS =====
window.createPost=async()=>{
  let mediaUrl="";
  if(postMedia.files[0]){
    const fileRef=ref(storage,"posts/"+Date.now());
    await uploadBytes(fileRef,postMedia.files[0]);
    mediaUrl=await getDownloadURL(fileRef);
  }
  await addDoc(collection(db,"posts"),{uid:currentUser.uid,text:postText.value,media:mediaUrl,createdAt:serverTimestamp()});
  postText.value="";
}
function loadFeed(){
  const q=query(collection(db,"posts"));
  onSnapshot(q,snap=>{
    feed.innerHTML="";
    snap.forEach(d=>{
      const p=d.data();
      feed.innerHTML+=`<div class="post">${p.text}${p.media?`<div>${p.media.endsWith(".mp3")?`<audio controls src="${p.media}"></audio>`:p.media.endsWith(".mp4")?`<video width="200" controls src="${p.media}"></video>`:`<img src="${p.media}" width="200">`}</div>`:""}</div>`;
    });
  });
}

// ===== STORIES =====
function loadStories(){
  onSnapshot(collection(db,"posts"),snap=>{
    stories.innerHTML="";
    snap.forEach(d=>{
      const s=d.data();
      stories.innerHTML+=`<div class="story">${s.uid.slice(0,6)}</div>`;
    });
  });
}

// ===== GLOBAL CHAT =====
window.sendGlobalMessage=async()=>{
  if(!globalMessage.value)return;
  await addDoc(collection(db,"messages"),{uid:currentUser.uid,text:globalMessage.value,createdAt:serverTimestamp()});
  globalMessage.value="";
}
function loadChat(){
  onSnapshot(collection(db,"messages"),snap=>{
    globalChat.innerHTML="";
    snap.forEach(d=>{
      const m=d.data();
      globalChat.innerHTML+=`<div><b>${m.uid.slice(0,6)}</b>: ${m.text}</div>`;
    });
  });
}

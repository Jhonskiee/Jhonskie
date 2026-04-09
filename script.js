import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot, serverTimestamp, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyA4F9GnvJZ-AGzID63vqQO79zJulh2NJmY",
  authDomain: "abcs-5859c.firebaseapp.com",
  projectId: "abcs-5859c",
  storageBucket: "abcs-5859c.firebasestorage.app",
  messagingSenderId: "479969126573",
  appId: "1:479969126573:web:26bdd9ff755a92615afe24",
  measurementId: "G-KTV3112JXN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;

// UI FUNCTIONS
window.showRegister = () => {loginForm.classList.add('hidden'); forgotFormContainer.classList.add('hidden'); registerForm.classList.remove('hidden');};
window.showLogin = () => {registerForm.classList.add('hidden'); forgotFormContainer.classList.add('hidden'); loginForm.classList.remove('hidden');};
window.showForgot = () => {loginForm.classList.add('hidden'); registerForm.classList.add('hidden'); forgotFormContainer.classList.remove('hidden');};

// AUTH FUNCTIONS
window.register = async () => {
  const name = regName.value; const email = regEmail.value; const password = regPassword.value;
  if(!name || !email || !password) return alert("Fill all fields");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db,"users",cred.user.uid), {uid:cred.user.uid, name, email, bio:"", profilePic:"", friends:[], requests:[], createdAt:serverTimestamp()});
  alert("Account created!"); showLogin();
};

window.login = async () => {
  await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
};

window.logout = () => signOut(auth);

window.forgotPassword = async () => {
  if(!forgotEmail.value) return alert("Enter email");
  await sendPasswordResetEmail(auth, forgotEmail.value);
  forgotMessage.style.display = "block";
};

// REAL-TIME AUTH STATE
onAuthStateChanged(auth, user => {
  if(user){
    currentUser = user;
    authPage.classList.add('hidden'); homePage.classList.remove('hidden');
    loadProfile(); loadFeed(); loadStories(); loadGlobalChat(); loadFriends(); loadFriendRequests(); loadPrivateChat();
  } else {authPage.classList.remove('hidden'); homePage.classList.add('hidden');}
});

// Profile
profileUpload.onchange = async e => {
  const fileRef = ref(storage,"profiles/"+currentUser.uid);
  await uploadBytes(fileRef,e.target.files[0]);
  const url = await getDownloadURL(fileRef);
  await setDoc(doc(db,"users",currentUser.uid),{profilePic:url},{merge:true});
};

window.updateProfile = async () => {await setDoc(doc(db,"users",currentUser.uid),{bio:bio.value},{merge:true}); alert("Profile updated");};
function loadProfile(){onSnapshot(doc(db,"users",currentUser.uid),snap=>{const data=snap.data(); profilePic.src=data.profilePic||""; bio.value=data.bio||""; welcomeUser.innerText=data.name;});}

// Posts
window.createPost = async () => {
  let mediaUrl = "";
  if(postMedia.files[0]){
    const fileRef = ref(storage,"posts/"+Date.now());
    await uploadBytes(fileRef,postMedia.files[0]);
    mediaUrl = await getDownloadURL(fileRef);
  }
  await addDoc(collection(db,"posts"),{uid:currentUser.uid,text:postText.value,media:mediaUrl,createdAt:serverTimestamp()});
  postText.value="";
};
function loadFeed(){onSnapshot(query(collection(db,"posts")),snap=>{feed.innerHTML="";snap.forEach(d=>{const p=d.data();feed.innerHTML+=`<div class="post"><b>${p.uid.slice(0,6)}</b>: ${p.text}${p.media?`<div>${p.media.endsWith(".mp3")?`<audio controls src="${p.media}"></audio>`:p.media.endsWith(".mp4")?`<video width="200" controls src="${p.media}"></video>`:`<img src="${p.media}" width="200">`}</div>`:""}</div>`;});});});

// TODO: Implement stories, chat, friends same way as feed (real-time)

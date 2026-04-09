import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot, serverTimestamp, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase config
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

// ----------------- UI helpers -----------------
window.showRegister = () => { loginForm.style.display = "none"; registerForm.style.display = "block"; }
window.showLogin = () => { loginForm.style.display = "block"; registerForm.style.display = "none"; }

// ----------------- AUTH -----------------
window.register = async () => {
  if(!regName.value || !regEmail.value || !regPassword.value) return alert("Fill all fields");
  try {
    const cred = await createUserWithEmailAndPassword(auth, regEmail.value, regPassword.value);
    await setDoc(doc(db,"users",cred.user.uid), {
      uid: cred.user.uid,
      name: regName.value,
      email: regEmail.value,
      bio: "",
      profilePic: "",
      friends: [],
      requests: [],
      createdAt: serverTimestamp()
    });
  } catch(e){ alert(e.message); }
}

window.login = async () => {
  if(!loginEmail.value || !loginPassword.value) return alert("Fill all fields");
  try { await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value); } 
  catch(e){ alert(e.message); }
}

window.logout = () => signOut(auth);

window.forgotPassword = async () => {
  const email = prompt("Enter your email for password reset");
  if(!email) return;
  try {
    await sendPasswordResetEmail(auth,email);
    alert("Check your email for reset link");
  } catch(e){ alert(e.message); }
}

// ----------------- AUTH STATE -----------------
onAuthStateChanged(auth,user=>{
  if(user){
    currentUser=user;
    authPage.style.display="none"; homePage.style.display="block";
    loadProfile(); loadFeed(); loadStories(); loadGlobalChat(); loadFriends(); loadFriendRequests(); loadPrivateChat();
  } else {
    authPage.style.display="flex"; homePage.style.display="none";
  }
});

// ----------------- PROFILE -----------------
profileUpload.onchange = async e => {
  const file = e.target.files[0];
  const fileRef = ref(storage, "profiles/"+currentUser.uid);
  await uploadBytes(fileRef,file);
  const url = await getDownloadURL(fileRef);
  await setDoc(doc(db,"users",currentUser.uid), { profilePic: url }, { merge:true });
};

window.updateProfile = async () => {
  await setDoc(doc(db,"users",currentUser.uid), { bio: bio.value }, { merge:true });
  alert("Profile updated");
};

function loadProfile(){
  onSnapshot(doc(db,"users",currentUser.uid), snap => {
    const data = snap.data();
    profilePic.src = data.profilePic || "";
    bio.value = data.bio || "";
    welcomeUser.innerText = data.name;
  });
}

// ----------------- POSTS -----------------
window.createPost = async () => {
  let mediaUrl = "";
  if(postMedia.files[0]){
    const fileRef = ref(storage,"posts/"+Date.now());
    await uploadBytes(fileRef,postMedia.files[0]);
    mediaUrl = await getDownloadURL(fileRef);
  }
  await addDoc(collection(db,"posts"), { uid: currentUser.uid, text: postText.value, media: mediaUrl, createdAt: serverTimestamp() });
  postText.value="";
}

function loadFeed(){
  onSnapshot(query(collection(db,"posts")), snap => {
    feed.innerHTML="";
    snap.forEach(d=>{
      const p = d.data();
      feed.innerHTML += `<div class="post">
        <b>${p.uid.slice(0,6)}</b>: ${p.text}
        ${p.media ? `<div>${p.media.endsWith(".mp3")?`<audio controls src="${p.media}"></audio>`:
        p.media.endsWith(".mp4")?`<video width="200" controls src="${p.media}"></video>`:
        `<img src="${p.media}" width="200" style="border-radius:8px;">`}</div>`:""}
      </div>`;
    });
  });
}

// ----------------- STORIES -----------------
function loadStories(){
  onSnapshot(collection(db,"posts"), snap => {
    stories.innerHTML="";
    snap.forEach(d=>{
      const s = d.data();
      stories.innerHTML += `<div class="story">${s.uid.slice(0,6)}</div>`;
    });
  });
}

// ----------------- GLOBAL CHAT -----------------
window.sendGlobalMessage = async () => {
  if(!globalMessage.value) return;
  await addDoc(collection(db,"messages"), { uid: currentUser.uid, text: globalMessage.value, createdAt: serverTimestamp() });
  globalMessage.value="";
}

function loadGlobalChat(){
  onSnapshot(collection(db,"messages"), snap => {
    globalChat.innerHTML="";
    snap.forEach(d=>{
      const m = d.data();
      globalChat.innerHTML += `<div><b>${m.uid.slice(0,6)}</b>: ${m.text}</div>`;
    });
  });
}

// ----------------- FRIENDS -----------------
window.sendFriendRequest = async () => {
  if(!addFriendUID.value) return;
  const fuid = addFriendUID.value;
  const targetRef = doc(db,"users",fuid);
  const targetSnap = await targetRef.get();
  const requests = targetSnap.data()?.requests || [];
  if(!requests.includes(currentUser.uid)){
    await setDoc(targetRef,{ requests: [...requests, currentUser.uid] }, { merge:true });
    alert("Request sent");
  } else alert("Already sent");
}

function loadFriendRequests(){
  onSnapshot(doc(db,"users",currentUser.uid), snap => {
    friendRequests.innerHTML="";
    (snap.data()?.requests || []).forEach(uid=>{
      const div = document.createElement("div");
      div.innerHTML = `Request from ${uid.slice(0,6)} <button onclick="acceptRequest('${uid}')">Accept</button>`;
      friendRequests.appendChild(div);
    });
  });
}

window.acceptRequest = async uid => {
  const userRef = doc(db,"users",currentUser.uid);
  const friendRef = doc(db,"users",uid);
  const userSnap = await userRef.get();
  const friendSnap = await friendRef.get();
  const userData = userSnap.data();
  const friendData = friendSnap.data();
  await setDoc(userRef,{ friends:[...userData.friends, uid], requests:userData.requests.filter(f=>f!==uid) }, { merge:true });
  await setDoc(friendRef,{ friends:[...friendData.friends, currentUser.uid] }, { merge:true });
}

function loadFriends(){
  onSnapshot(doc(db,"users",currentUser.uid), snap => {
    friendsList.innerHTML="";
    (snap.data()?.friends || []).forEach(fuid=>{
      friendsList.innerHTML += `<div>${fuid.slice(0,6)} <button onclick="unfriend('${fuid}')">Unfriend</button></div>`;
    });
  });
}

window.unfriend = async uid => {
  const userRef = doc(db,"users",currentUser.uid);
  const friendRef = doc(db,"users",uid);
  const userSnap = await userRef.get();
  const friendSnap = await friendRef.get();
  await setDoc(userRef, { friends: userSnap.data().friends.filter(f=>f!==uid) }, { merge:true });
  await setDoc(friendRef, { friends: friendSnap.data().friends.filter(f=>f!==currentUser.uid) }, { merge:true });
}

// ----------------- PRIVATE CHAT -----------------
window.sendPrivateMessage = async () => {
  if(!privateMessage.value || !chatFriendUID.value) return;
  const fuid = chatFriendUID.value;
  const userSnap = await doc(db,"users",currentUser.uid).get();
  if(!userSnap.data().friends.includes(fuid)) return alert("Not your friend");
  const chatId = [currentUser.uid,fuid].sort().join("_");
  await addDoc(collection(db,"privateChats",chatId,"messages"), { from: currentUser.uid, text: privateMessage.value, createdAt: serverTimestamp() });
  privateMessage.value="";
}

function loadPrivateChat(){
  onSnapshot(collection(db,"privateChats"), snap => {
    privateChat.innerHTML="";
    snap.forEach(d=>{
      const chat = d.data();
      // only show messages for selected friend
      if(chatFriendUID.value && (chat.from === currentUser.uid || chat.from === chatFriendUID.value)){
        privateChat.innerHTML += `<div><b>${chat.from.slice(0,6)}</b>: ${chat.text}</div>`;
      }
    });
  });
}

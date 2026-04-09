import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, query, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* FIREBASE CONFIG */
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

let currentUser;

/* AUTH FUNCTIONS */
window.register=async()=>{
  const cred = await createUserWithEmailAndPassword(auth, regEmail.value, regPassword.value);
  await setDoc(doc(db,"users",cred.user.uid),{
    name:regName.value, uid:cred.user.uid,
    friends:[], requests:[], blocked:[]
  });
};
window.login=async()=>{await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);}
window.logout=()=>signOut(auth);

/* AUTH STATE */
onAuthStateChanged(auth,user=>{
  if(user){
    currentUser=user;
    authPage.style.display="none";
    homePage.style.display="block";

    updateDoc(doc(db,"users",user.uid),{online:true});
    loadAll();
    window.addEventListener("beforeunload",()=>{
      updateDoc(doc(db,"users",user.uid),{online:false});
    });
  } else {
    authPage.style.display="flex";
    homePage.style.display="none";
  }
});

/* LOAD EVERYTHING */
function loadAll(){
  loadFeed();
  loadStories();
  loadGlobalChat();
  loadPrivateChat();
  loadFriends();
  loadFriendRequests();
}

/* PROFILE UPDATE */
profileUpload.onchange=async e=>{
  const file=e.target.files[0];
  const fileRef=ref(storage,"profiles/"+currentUser.uid);
  await uploadBytes(fileRef,file);
  const url=await getDownloadURL(fileRef);
  await setDoc(doc(db,"users",currentUser.uid),{profilePic:url},{merge:true});
};
window.updateProfile=async()=>{
  await setDoc(doc(db,"users",currentUser.uid),{bio:bio.value},{merge:true});
  alert("Profile Updated");
};

/* POSTS */
window.createPost=async()=>{
  await addDoc(collection(db,"posts"),{
    uid:currentUser.uid,text:postText.value,createdAt:serverTimestamp()
  });
  postText.value="";
};
function loadFeed(){
  onSnapshot(query(collection(db,"posts"),orderBy("createdAt","desc")),snap=>{
    feed.innerHTML="";
    snap.forEach(d=>{
      const p=d.data();
      feed.innerHTML+=`<div class="post">${p.text}</div>`;
    });
  });
}

/* STORIES */
window.addStory=async()=>{
  const file=storyUpload.files[0];
  const r=ref(storage,"stories/"+Date.now());
  await uploadBytes(r,file);
  const url=await getDownloadURL(r);
  await addDoc(collection(db,"stories"),{
    uid:currentUser.uid,media:url,createdAt:Date.now()
  });
};
function loadStories(){
  onSnapshot(collection(db,"stories"),snap=>{
    stories.innerHTML="";
    snap.forEach(d=>{
      const s=d.data();
      if(Date.now()-s.createdAt>86400000){deleteDoc(d.ref);return;}
      stories.innerHTML+=`<img src="${s.media}">`;
    });
  });
}

/* GLOBAL CHAT */
window.sendGlobalMessage=async()=>{
  if(!globalMessage.value)return;
  await addDoc(collection(db,"messages"),{
    uid:currentUser.uid,text:globalMessage.value,createdAt:serverTimestamp()
  });
  globalMessage.value="";
};
function loadGlobalChat(){
  onSnapshot(query(collection(db,"messages"),orderBy("createdAt")),snap=>{
    globalChat.innerHTML="";
    snap.forEach(d=>{
      globalChat.innerHTML+=`<div>${d.data().text}</div>`;
    });
  });
}

/* PRIVATE CHAT */
window.sendPrivateMessage=async()=>{
  const fuid=chatUID.value;
  if(!fuid||!privateMessage.value)return;
  const chatId=[currentUser.uid,fuid].sort().join("_");
  await addDoc(collection(db,"privateChats",chatId,"messages"),{
    text:privateMessage.value,from:currentUser.uid,seen:false,createdAt:serverTimestamp()
  });
  privateMessage.value="";
};
function loadPrivateChat(){
  chatUID.onchange=()=>{
    const fuid=chatUID.value;
    const chatId=[currentUser.uid,fuid].sort().join("_");
    onSnapshot(query(collection(db,"privateChats",chatId,"messages"),orderBy("createdAt")),snap=>{
      privateChat.innerHTML="";
      snap.forEach(async d=>{
        const m=d.data();
        if(m.from!==currentUser.uid && !m.seen){
          await updateDoc(d.ref,{seen:true});
        }
        privateChat.innerHTML+=`<div>${m.text}</div>`;
      });
    });
  };
}

/* FRIENDS */
window.sendFriendRequest=async()=>{
  const fuid=addFriendUID.value;
  if(!fuid)return;
  const snap=await getDoc(doc(db,"users",fuid));
  await setDoc(doc(db,"users",fuid),{
    requests:[...(snap.data()?.requests||[]),currentUser.uid]
  },{merge:true});
};
function loadFriendRequests(){
  onSnapshot(doc(db,"users",currentUser.uid),snap=>{
    friendRequests.innerHTML="";
    (snap.data()?.requests||[]).forEach(uid=>{
      friendRequests.innerHTML+=`<div>${uid}<button onclick="acceptRequest('${uid}')">✔</button></div>`;
    });
  });
}
window.acceptRequest=async(uid)=>{
  const u=doc(db,"users",currentUser.uid);
  const f=doc(db,"users",uid);
  const us=await getDoc(u);
  const fs=await getDoc(f);
  await setDoc(u,{
    friends:[...(us.data()?.friends||[]),uid],
    requests:us.data()?.requests.filter(r=>r!==uid)
  },{merge:true});
  await setDoc(f,{
    friends:[...(fs.data()?.friends||[]),currentUser.uid]
  },{merge:true});
};
function loadFriends(){
  onSnapshot(doc(db,"users",currentUser.uid),snap=>{
    friendsList.innerHTML="";
    (snap.data()?.friends||[]).forEach(fuid=>{
      friendsList.innerHTML+=`<div>${fuid}</div>`;
    });
  });
}

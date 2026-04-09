import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, query, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* 🔥 PUT YOUR CONFIG */
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

/* AUTH */
window.register=async()=>{
  const cred=await createUserWithEmailAndPassword(auth,regEmail.value,regPassword.value);
  await setDoc(doc(db,"users",cred.user.uid),{
    name:regName.value,uid:cred.user.uid,
    friends:[],requests:[],blocked:[]
  });
};
window.login=async()=>{await signInWithEmailAndPassword(auth,loginEmail.value,loginPassword.value);}
window.logout=()=>signOut(auth);

/* STATE */
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

  }else{
    authPage.style.display="flex";
    homePage.style.display="none";
  }
});

/* LOAD ALL */
function loadAll(){
  loadFeed();
  loadStories();
  loadChat();
  loadPrivateChat();
  loadRequests();
  loadFriends();
  loadNotifications();
  listenTyping();
}

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
      feed.innerHTML+=`<div class="post">${d.data().text}</div>`;
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
  await addDoc(collection(db,"messages"),{
    text:globalMessage.value,uid:currentUser.uid,createdAt:serverTimestamp()
  });
  globalMessage.value="";
};
function loadChat(){
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

        privateChat.innerHTML+=`
          <div>${m.text} ${m.from===currentUser.uid?(m.seen?"✔✔":"✔"):""}</div>`;
      });
    });
  };
}

/* TYPING */
let typingTimeout;
privateMessage.addEventListener("input",async()=>{
  const chatId=[currentUser.uid,chatUID.value].sort().join("_");

  await setDoc(doc(db,"typing",chatId),{[currentUser.uid]:true},{merge:true});

  clearTimeout(typingTimeout);
  typingTimeout=setTimeout(async()=>{
    await setDoc(doc(db,"typing",chatId),{[currentUser.uid]:false},{merge:true});
  },2000);
});
function listenTyping(){
  onSnapshot(doc(db,"typing",[currentUser.uid,chatUID.value].sort().join("_")),snap=>{
    const d=snap.data();
    if(!d)return;
    typingStatus.innerText=d[chatUID.value]?"Typing...":"";
  });
}

/* FRIENDS */
window.sendFriendRequest=async()=>{
  const fuid=addFriendUID.value;
  const snap=await getDoc(doc(db,"users",fuid));

  await setDoc(doc(db,"users",fuid),{
    requests:[...(snap.data().requests||[]),currentUser.uid]
  },{merge:true});
};

function loadRequests(){
  onSnapshot(doc(db,"users",currentUser.uid),snap=>{
    friendRequests.innerHTML="";
    (snap.data().requests||[]).forEach(uid=>{
      friendRequests.innerHTML+=`
        <div>${uid}
        <button onclick="acceptRequest('${uid}')">✔</button>
        </div>`;
    });
  });
}

window.acceptRequest=async(uid)=>{
  const u=doc(db,"users",currentUser.uid);
  const f=doc(db,"users",uid);

  const us=await getDoc(u);
  const fs=await getDoc(f);

  await setDoc(u,{
    friends:[...(us.data().friends||[]),uid],
    requests:us.data().requests.filter(r=>r!==uid)
  },{merge:true});

  await setDoc(f,{
    friends:[...(fs.data().friends||[]),currentUser.uid]
  },{merge:true});
};

function loadFriends(){
  onSnapshot(doc(db,"users",currentUser.uid),async snap=>{
    friendsList.innerHTML="";
    for(const uid of (snap.data().friends||[])){
      const f=await getDoc(doc(db,"users",uid));
      friendsList.innerHTML+=`${uid} ${f.data().online?"🟢":"⚫"}<br>`;
    }
  });
}

/* NOTIFICATIONS */
function loadNotifications(){
  onSnapshot(collection(db,"notifications"),snap=>{
    notifications.innerHTML="";
    snap.forEach(d=>{
      const n=d.data();
      if(n.to===currentUser.uid){
        notifications.innerHTML+=`<div>${n.text}</div>`;
      }
    });
  });
}

window.onload = function () {

  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
  };

  firebase.initializeApp(firebaseConfig);

  const db = firebase.database();
  const auth = firebase.auth();

  class App {

    title() {
      let div = document.createElement('div');
      div.id = 'title_container';

      let h1 = document.createElement('h1');
      h1.id = 'title';
      h1.textContent = 'Life Is Unfair';

      div.appendChild(h1);
      document.body.appendChild(div);
    }

    home() {
      document.body.innerHTML = '';
      this.title();

      let container = document.createElement('div');
      container.className = 'container';

      let name = document.createElement('input');
      name.placeholder = 'Name';

      let email = document.createElement('input');
      email.placeholder = 'Email';

      let pass = document.createElement('input');
      pass.placeholder = 'Password';
      pass.type = 'password';

      let login = document.createElement('button');
      login.textContent = 'Login';

      let register = document.createElement('button');
      register.textContent = 'Create Account';

      let forgot = document.createElement('button');
      forgot.textContent = 'Forgot Password';

      login.onclick = () => {
        auth.signInWithEmailAndPassword(email.value, pass.value)
        .catch(e => alert(e.message));
      };

      register.onclick = () => {
        auth.createUserWithEmailAndPassword(email.value, pass.value)
        .then(user => {
          user.user.updateProfile({ displayName: name.value });
        })
        .catch(e => alert(e.message));
      };

      forgot.onclick = () => {
        if (!email.value) return alert("Enter email first");
        auth.sendPasswordResetEmail(email.value)
        .then(() => alert("Email sent"))
        .catch(e => alert(e.message));
      };

      container.append(name, email, pass, login, register, forgot);
      document.body.appendChild(container);
    }

    chat(user) {
      document.body.innerHTML = '';
      this.title();

      let chat = document.createElement('div');
      chat.className = 'chat';

      let messages = document.createElement('div');
      messages.className = 'messages';

      let input = document.createElement('input');
      input.placeholder = 'Type message...';

      let send = document.createElement('button');
      send.textContent = 'Send';

      let typing = document.createElement('div');
      typing.className = 'typing';

      let online = document.createElement('div');
      online.className = 'online';

      let logout = document.createElement('button');
      logout.textContent = 'Logout';

      // SEND
      send.onclick = () => {
        if (!input.value.trim()) return;

        db.ref('messages').push({
          name: user.displayName || user.email,
          text: input.value
        });

        db.ref('typing/' + user.uid).remove();
        input.value = '';
      };

      // TYPING
      input.oninput = () => {
        db.ref('typing/' + user.uid).set(user.displayName || user.email);

        setTimeout(() => {
          db.ref('typing/' + user.uid).remove();
        }, 2000);
      };

      // LOGOUT
      logout.onclick = () => {
        db.ref('online/' + user.uid).remove();
        auth.signOut();
      };

      chat.append(messages, input, send, typing, online, logout);
      document.body.appendChild(chat);

      // REALTIME CHAT
      db.ref('messages').on('value', snap => {
        messages.innerHTML = '';
        snap.forEach(d => {
          let m = d.val();
          let p = document.createElement('div');
          p.className = 'message';
          p.textContent = m.name + ": " + m.text;
          messages.appendChild(p);
        });
      });

      // ONLINE USERS
      db.ref('online/' + user.uid).set(user.displayName || user.email);

      db.ref('online').on('value', snap => {
        online.innerHTML = "<b>Online:</b><br>";
        snap.forEach(u => {
          let p = document.createElement('div');
          p.textContent = "🟢 " + u.val();
          online.appendChild(p);
        });
      });

      // TYPING DISPLAY
      db.ref('typing').on('value', snap => {
        typing.innerHTML = '';
        snap.forEach(t => {
          if (t.key !== user.uid) {
            typing.textContent = t.val() + " is typing...";
          }
        });
      });
    }
  }

  const app = new App();

  auth.onAuthStateChanged(user => {
    if (user) {
      app.chat(user);
    } else {
      app.home();
    }
  });
};

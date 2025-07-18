// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyAJ9Gr6lxmRZnHB5rJ_8CvkSxg3U6PGvl4",
  authDomain: "absolute-realm-441406-r6.firebaseapp.com",
  databaseURL: "https://absolute-realm-441406-r6-default-rtdb.firebaseio.com",
  projectId: "absolute-realm-441406-r6",
  storageBucket: "absolute-realm-441406-r6.appspot.com",
  messagingSenderId: "574988521817",
  appId: "1:574988521817:web:37dd0cee88d2d15893bc48"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.auth = firebase.auth();
window.db = firebase.firestore();

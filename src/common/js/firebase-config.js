// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyALeNZtkf77KHG8dJ5XQvpV-1oMxtEpcds",
  authDomain: "grass-971ce.firebaseapp.com",
  projectId: "grass-971ce",
  storageBucket: "grass-971ce.firebasestorage.app",
  messagingSenderId: "775597931199",
  appId: "1:775597931199:web:882eae76df35e5c40f240a",
  measurementId: "G-1VF90P2NJQ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.auth = firebase.auth();
window.db = firebase.firestore();

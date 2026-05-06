import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, getDocs, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';

const app = initializeApp({
  apiKey: 'AIzaSyAEL_wjUGJuVOnPbJbrWAvMrjMXSTjITLw',
  authDomain: 'invitea-64288.firebaseapp.com',
  projectId: 'invitea-64288',
  storageBucket: 'invitea-64288.firebasestorage.app',
  messagingSenderId: '198599348885',
  appId: '1:198599348885:web:fcf95c5edeb77872c9019c',
  measurementId: 'G-VKWVBZCQGY'
});

const db = getFirestore(app);
const auth = getAuth(app);

window.__INVITEA_DB = db;
window.__INVITEA_COL = collection;
window.__INVITEA_ADD = addDoc;
window.__INVITEA_TS = serverTimestamp;

// Auth helpers
window.__INVITEA_AUTH = auth;
window.__INVITEA_SIGN_OUT = signOut;
window.__INVITEA_ON_AUTH = onAuthStateChanged;
window.__INVITEA_GOOGLE_PROVIDER = new GoogleAuthProvider();
window.__INVITEA_SIGN_IN_EMAIL = signInWithEmailAndPassword;
window.__INVITEA_SIGN_UP_EMAIL = createUserWithEmailAndPassword;
window.__INVITEA_SIGN_IN_POPUP = signInWithPopup;

// User profile helpers
window.__INVITEA_DOC_REF = doc;
window.__INVITEA_GET_DOC = getDoc;
window.__INVITEA_GET_DOCS = getDocs;
window.__INVITEA_SET_DOC = setDoc;

window.__INVITEA_USER = null;

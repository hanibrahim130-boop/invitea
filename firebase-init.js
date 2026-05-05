import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

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
window.__INVITEA_DB = db;
window.__INVITEA_COL = collection;
window.__INVITEA_ADD = addDoc;
window.__INVITEA_TS = serverTimestamp;

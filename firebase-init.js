import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

const app = initializeApp({
  apiKey: 'BLGnQtXpzwa2kXIOwD9nJP_7534xbOCy0dKpPM0kj9qs03gMnq9eDkmCCl3XXxNoXW3XjY7ILYEOXm-2pFPwO7M',
  authDomain: 'invitea.firebaseapp.com',
  projectId: 'invitea',
  storageBucket: 'invitea.firebasestorage.app'
});

const db = getFirestore(app);
window.__INVITEA_DB = db;
window.__INVITEA_COL = collection;
window.__INVITEA_ADD = addDoc;
window.__INVITEA_TS = serverTimestamp;

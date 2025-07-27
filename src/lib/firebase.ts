import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5llb0VVYA7aVzEcK0LdB_EhQyTAtm7JU",
  authDomain: "web-stylesup.firebaseapp.com",
  projectId: "web-stylesup",
  storageBucket: "web-stylesup.appspot.com",
  messagingSenderId: "850316642898",
  appId: "1:850316642898:web:62aea4830c81a6eb44ad8b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

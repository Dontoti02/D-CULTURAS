
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyALQZSXlmwjNZgLwloRJ2lStvbRbgp44CU",
  authDomain: "stylesup-21f14.firebaseapp.com",
  projectId: "stylesup-21f14",
  storageBucket: "stylesup-21f14.appspot.com",
  messagingSenderId: "879459866915",
  appId: "1:879459866915:web:57cda699e01ddbf1b95496"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

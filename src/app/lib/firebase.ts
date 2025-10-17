// src/app/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";



// ✅ Only initialize once (Next.js reloads modules often)
const firebaseConfig = {
  apiKey: "AIzaSyBHTZ65bLwlAN9wQhUFFytBW3isgqDMq6Q",
  authDomain: "peerconnect-8055e.firebaseapp.com",
  projectId: "peerconnect-8055e",
  storageBucket: "peerconnect-8055e.appspot.com",
  messagingSenderId: "845117593883",
  appId: "1:845117593883:web:9abfb78c4d37a33a6f9bbe",
};

// ✅ Initialize safely (works both server/client)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Firestore export
export const db = getFirestore(app);
export const auth = getAuth(app);
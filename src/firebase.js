// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCD21iMwBE3nYzbzgxVIeaF1pzTboYoKCc",
  authDomain: "crapbook-42b77.firebaseapp.com",
  projectId: "crapbook-42b77",
  storageBucket: "crapbook-42b77.firebasestorage.app",
  messagingSenderId: "132932370631",
  appId: "1:132932370631:web:2b3924a44010bfc81a3ee2",
  measurementId: "G-4DNK7F3ZSG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the auth service
export const auth = getAuth(app);

// Get a reference to the firestore service
export const db = getFirestore(app);

// Get a reference to the storage service
export const storage = getStorage(app);

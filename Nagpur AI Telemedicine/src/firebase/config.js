import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
    apiKey: "AIzaSyDb9JjZ061K-fKCIA8RqEh8FlYpIupRUUs",
    authDomain: "kiro-f5e7b.firebaseapp.com",
    projectId: "kiro-f5e7b",
    storageBucket: "kiro-f5e7b.firebasestorage.app",
    messagingSenderId: "1069464653863",
    appId: "1:1069464653863:web:d6d8b5f5e7c8a9b0c1d2e3"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    console.error('Please check your Firebase configuration in src/firebase/config.js');
}

export { auth, db };
export default app;

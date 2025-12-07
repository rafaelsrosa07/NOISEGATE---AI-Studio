import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração oficial do Noise Gate
const firebaseConfig = {
  apiKey: "AIzaSyD7HuAKd2TWfopj6iuY8zZc5af7rCo6zWo",
  authDomain: "noisegate-d51c4.firebaseapp.com",
  projectId: "noisegate-d51c4",
  storageBucket: "noisegate-d51c4.firebasestorage.app",
  messagingSenderId: "479672070730",
  appId: "1:479672070730:web:a878c5c71f4f52113d2cb3",
  measurementId: "G-VWCK7SR4GF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Analytics (Safe initialization)
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(console.error);
}

// Config Google Auth
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
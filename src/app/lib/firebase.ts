import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyC4-2khxnKFJMFA8SGCvjNo7XsQdP-MOHc",
  authDomain: "hopebridge-foundation-70490.firebaseapp.com",
  projectId: "hopebridge-foundation-70490",
  storageBucket: "hopebridge-foundation-70490.firebasestorage.app",
  messagingSenderId: "217007162999",
  appId: "1:217007162999:web:31dc5e7a63e4f904c32872",
};

const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

  export const auth = getAuth(app);
  export const db = getFirestore(app);
  
  export default app;
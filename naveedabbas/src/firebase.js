// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKDlVC3HB0OKGdFyaAYRsUU9Y34pUPkJ8",
  authDomain: "naveedabbasdev.firebaseapp.com",
  projectId: "naveedabbasdev",
  storageBucket: "naveedabbasdev.firebasestorage.app",
  messagingSenderId: "687335600715",
  appId: "1:687335600715:web:66d9a47e64268e634bd3ce",
  measurementId: "G-P27V1SMMSV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics };

// default export (convenience)
export default db;

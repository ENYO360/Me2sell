// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCz5Cu6UosLpJcFJKZG_I1OwjasqXRt_BE",
  authDomain: "sales-book-d66c5.firebaseapp.com",
  projectId: "sales-book-d66c5",
  storageBucket: "sales-book-d66c5.firebasestorage.app",
  messagingSenderId: "800629611547",
  appId: "1:800629611547:web:88493b72f1d7cee600acbe",
  measurementId: "G-V1QLTFRDPX"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
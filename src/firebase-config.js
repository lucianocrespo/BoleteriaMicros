import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDi7vEhtfEHFBbnyPNwkfUZWWFT_YHkTy4",
  authDomain: "pruebaboleteria.firebaseapp.com",
  projectId: "pruebaboleteria",
  storageBucket: "pruebaboleteria.firebasestorage.app",
  messagingSenderId: "785060527010",
  appId: "1:785060527010:web:25adcbd6fa189a07dc90fb",
  measurementId: "G-5TJ0XFB2YM"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

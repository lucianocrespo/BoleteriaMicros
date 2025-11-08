import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB2qIRfdbHftrXF3Irdhuu1xgzppXWZjzQ",
  authDomain: "boleteria-bec7d.firebaseapp.com",
  projectId: "boleteria-bec7d",
  storageBucket: "boleteria-bec7d.firebasestorage.app",
  messagingSenderId: "851381896189",
  appId: "1:851381896189:web:5a08dc51f0279893ee0f94"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

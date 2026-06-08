// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACUdQqsisayMqkJvdthimst2rGf_yH2aI",
  authDomain: "football-tournament-ddd5a.firebaseapp.com",
  projectId: "football-tournament-ddd5a",
  storageBucket: "football-tournament-ddd5a.firebasestorage.app",
  messagingSenderId: "230308344063",
  appId: "1:230308344063:web:c18328ea471d387d0f9cca"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
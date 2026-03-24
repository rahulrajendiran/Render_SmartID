import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBF6Iad4lBpapAZ5Y_3FKzM7vSdyToQC3Y",
    authDomain: "smartidunified.firebaseapp.com",
    projectId: "smartidunified",
    storageBucket: "smartidunified.firebasestorage.app",
    messagingSenderId: "25890097284",
    appId: "1:25890097284:web:6c14850fa2114323b8dad1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

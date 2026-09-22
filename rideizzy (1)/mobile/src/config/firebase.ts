// Get these values from Firebase Console > Project Settings > General > Your apps > Web app config
// (Firebase config values are safe to keep in client code - they are not secret;
// access is controlled by Firestore security rules, not by hiding this.)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "rideizzy-xxxxx.firebaseapp.com",
  projectId: "rideizzy-xxxxx",
  storageBucket: "rideizzy-xxxxx.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

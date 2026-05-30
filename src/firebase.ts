import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBn1Kq4HuuAXKqxviDRjLkssHExhvPXQr4",
  authDomain: "gzza-27d5b.firebaseapp.com",
  databaseURL: "https://gzza-27d5b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gzza-27d5b",
  storageBucket: "gzza-27d5b.firebasestorage.app",
  messagingSenderId: "86328165446",
  appId: "1:86328165446:web:c66293cefa005267f13647",
  measurementId: "G-9JYR9M2N0S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// Re-export RTDB helper methods
export { ref, onValue, set };

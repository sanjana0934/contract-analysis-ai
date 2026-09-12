import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlZv9aeju-9PnzYyL6t3IDf9XpzMS_u4I",
  authDomain: "contractai-eda85.firebaseapp.com",
  projectId: "contractai-eda85",
  storageBucket: "contractai-eda85.firebasestorage.app",
  messagingSenderId: "40089188314",
  appId: "1:40089188314:web:364ed3909788e41c3732e3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
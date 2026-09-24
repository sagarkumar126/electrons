import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDyCRx5jx4qta4yQi73_oWexm06beYflso",
  authDomain: "electrons-38bb5.firebaseapp.com",
  projectId: "electrons-38bb5",
  storageBucket: "electrons-38bb5.firebasestorage.app",
  messagingSenderId: "1080192111340",
  appId: "1:1080192111340:web:defe88a33b87282ee7cbc9"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
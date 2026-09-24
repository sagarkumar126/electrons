import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  
 apiKey: "AIzaSyAaD4e6VNsXQ_IZ7IT8SafFCLz_VCiVefo",
  authDomain: "yourelectronics-7aee3.firebaseapp.com",
  projectId: "yourelectronics-7aee3",
  storageBucket: "yourelectronics-7aee3.firebasestorage.app",
  messagingSenderId: "26692432991",
  appId: "1:26692432991:web:c0b3d6b73d78566b40d7ea"


}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const googleProvider = new GoogleAuthProvider()
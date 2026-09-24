import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyB73Av--J6b3gdhHLcIpG1UnMdaGC7OPwU",
  authDomain: "seller-app-4fafb.firebaseapp.com",
  projectId: "seller-app-4fafb",
  storageBucket: "seller-app-4fafb.firebasestorage.app",
  messagingSenderId: "456945725387",
  appId: "1:456945725387:web:fd1a5538fd93a256e2904e"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
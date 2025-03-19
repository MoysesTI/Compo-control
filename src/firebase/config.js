import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Substitua com suas próprias credenciais do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDh_dlDBsoKzzEVlw4zs1dVm2hjBuYZ028",
  authDomain: "sistema-web-68131.firebaseapp.com",
  projectId: "sistema-web-68131",
  storageBucket: "sistema-web-68131.firebasestorage.app",
  messagingSenderId: "324690151643",
  appId: "1:324690151643:web:de3bab4342b052c5baa4fe",
  measurementId: "G-89TM7NX1H8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

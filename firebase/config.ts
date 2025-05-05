import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPJN9ZTsbOGWpVcMLgHR0prod3YJ12-AY",
  authDomain: "patient-65da8.firebaseapp.com",
  projectId: "patient-65da8",
  storageBucket: "patient-65da8.firebasestorage.app",
  messagingSenderId: "665163436898",
  appId: "1:665163436898:web:12b75752555e40f3ebd23b",
  measurementId: "G-JS1KGLEJYJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;
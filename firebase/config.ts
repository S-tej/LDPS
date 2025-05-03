import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCD0nFxLlntZfVVle_umBDbel55rLZWV6c",
  authDomain: "hgs-stoorage.firebaseapp.com",
  databaseURL: "https://hgs-stoorage-default-rtdb.firebaseio.com",
  projectId: "hgs-stoorage",
  storageBucket: "hgs-stoorage.appspot.com",
  messagingSenderId: "756863944226",
  appId: "1:756863944226:web:590ed5b4dc426ab87bec7b",
  measurementId: "G-0SRKZHVML3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize other Firebase services
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;
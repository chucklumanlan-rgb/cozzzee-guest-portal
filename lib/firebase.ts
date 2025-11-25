import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, serverTimestamp, Timestamp } from "firebase/firestore/lite";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getRemoteConfig } from "firebase/remote-config";

// Robust configuration that works for both Vite (import.meta.env) and standard environments
// Includes explicit fallbacks for the CoZzzee Portal V2 project to prevent "Missing App configuration" errors
const getEnv = (key: string, fallback: string) => {
  // Check for Vite environment variables
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[`VITE_${key}`] || import.meta.env[key];
      if (val) return val;
  }
  // Fallback for Node/Next.js environments
  if (typeof process !== 'undefined' && process.env) {
      const val = process.env[`NEXT_PUBLIC_${key}`] || process.env[key];
      if (val) return val;
  }
  
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY", "AIzaSyDA0lZHCfT3BQC-xkEJF1uM_t_GZ1h9Wf8"),
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN", "cozzzee-portal-v2.firebaseapp.com"),
  projectId: getEnv("FIREBASE_PROJECT_ID", "cozzzee-portal-v2"),
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET", "cozzzee-portal-v2.firebasestorage.app"),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID", "432571407994"),
  appId: getEnv("FIREBASE_APP_ID", "1:432571407994:web:3cfe92b45b8ee6f7c565c3"),
};

// Initialize App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const remoteConfig = getRemoteConfig(app); // Initialize Remote Config
export const now = serverTimestamp;
export const toTimestamp = Timestamp.fromDate;
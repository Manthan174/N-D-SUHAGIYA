import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (safely checks if app is already initialized, especially for SSR/Next.js hot-reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let db: any;
try {
  db = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    ? getDatabase(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL)
    : getDatabase(app);
} catch (e) {
  console.error("Firebase Database initialization error:", e);
  db = {} as any;
}
let firestore: Firestore;

try {
  firestore = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  firestore = getFirestore(app);
}

const auth = getAuth(app);

// Secondary isolated instance for Super Admin to allow multi-tab usage without session conflicts
const superAdminApp = getApps().find(a => a.name === "superadmin") || initializeApp(firebaseConfig, "superadmin");
const superAdminAuth = getAuth(superAdminApp);
let superAdminFirestore: Firestore;

try {
  superAdminFirestore = initializeFirestore(superAdminApp, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  superAdminFirestore = getFirestore(superAdminApp);
}

const storage = getStorage(app);

export { app, db, firestore, auth, storage, superAdminAuth, superAdminFirestore };

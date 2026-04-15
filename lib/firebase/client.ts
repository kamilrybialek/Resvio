/**
 * Firebase Client SDK — browser-side only
 *
 * Reads from NEXT_PUBLIC_ environment variables. Safe to import in
 * 'use client' components; will throw at build time if accidentally
 * bundled into a server-only module that checks typeof window first.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Lazily initialise the Firebase app to avoid running in SSR / Edge contexts.
 * Call getFirebaseApp() only from client-side code paths.
 */
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

/**
 * Firebase Auth instance — call inside useEffect / event handlers, not
 * at module-level so SSR never executes Firebase browser code.
 */
export function getClientAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/**
 * Firestore client instance for browser usage.
 */
export function getClientDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

// Convenience re-exports for components that need both
export { getFirebaseApp };
export type { Auth, Firestore };

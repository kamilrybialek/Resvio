/**
 * Firebase Admin SDK — server-side only
 *
 * Never import this file from 'use client' components.
 * Relies on FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */

import { cert, getApps, initializeApp, getApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length > 0) return getApp();

  const projectId    = process.env.FIREBASE_PROJECT_ID;
  const clientEmail  = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel stores the private key with literal \n — replace them
  const privateKey   = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin: missing required environment variables ' +
      '(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

/**
 * Firebase Admin App — lazily initialised.
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * Admin Firestore instance.
 */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export { getAdminApp };
export type { Auth as AdminAuth, Firestore as AdminFirestore };

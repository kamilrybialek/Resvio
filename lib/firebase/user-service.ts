/**
 * Firestore user-data service
 *
 * Firestore document layout:
 *   users/{uid}/profile               → UserProfile
 *   users/{uid}/savedJobs/{jobId}     → Job
 *   users/{uid}/appliedJobs/{jobId}   → { appliedAt: string }
 *   users/{uid}/cvs/{cvId}            → { jobId, content, createdAt }
 *   users/{uid}/coverLetters/{clId}   → { jobId, content, createdAt }
 *   users/{uid}/settings              → Settings
 *
 * This module is server-side only (uses Admin SDK).
 * For browser-side reads, use the client SDK directly.
 */

import { getAdminDb } from './admin';
import type { UserProfile, Job } from '@/lib/types';
import type { MarketId } from '@/lib/markets';

export interface Settings {
  market: MarketId;
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS: Settings = {
  market: 'scandinavia',
  theme:  'system',
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function userRef(uid: string) {
  return getAdminDb().collection('users').doc(uid);
}

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────

/**
 * Fetch a user's profile from Firestore.
 * Returns null if the document doesn't exist.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await userRef(uid).collection('profile').doc('data').get();
    if (!snap.exists) return null;
    return snap.data() as UserProfile;
  } catch (err) {
    console.error('[user-service] getUserProfile error:', err);
    return null;
  }
}

/**
 * Write (merge) a user's profile to Firestore.
 */
export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  try {
    await userRef(uid).collection('profile').doc('data').set(profile, { merge: true });
  } catch (err) {
    console.error('[user-service] saveUserProfile error:', err);
  }
}

// ─────────────────────────────────────────────
// Saved Jobs
// ─────────────────────────────────────────────

/**
 * Return all jobs saved by the user.
 */
export async function getSavedJobs(uid: string): Promise<Job[]> {
  try {
    const snap = await userRef(uid).collection('savedJobs').get();
    return snap.docs.map(d => d.data() as Job);
  } catch (err) {
    console.error('[user-service] getSavedJobs error:', err);
    return [];
  }
}

/**
 * Save (upsert) a single job.
 */
export async function saveJob(uid: string, job: Job): Promise<void> {
  try {
    await userRef(uid).collection('savedJobs').doc(job.id).set(job);
  } catch (err) {
    console.error('[user-service] saveJob error:', err);
  }
}

/**
 * Remove a saved job by its ID.
 */
export async function removeJob(uid: string, jobId: string): Promise<void> {
  try {
    await userRef(uid).collection('savedJobs').doc(jobId).delete();
  } catch (err) {
    console.error('[user-service] removeJob error:', err);
  }
}

// ─────────────────────────────────────────────
// Applied Jobs
// ─────────────────────────────────────────────

/**
 * Return the list of job IDs the user has marked as applied.
 */
export async function getAppliedJobIds(uid: string): Promise<string[]> {
  try {
    const snap = await userRef(uid).collection('appliedJobs').get();
    return snap.docs.map(d => d.id);
  } catch (err) {
    console.error('[user-service] getAppliedJobIds error:', err);
    return [];
  }
}

/**
 * Mark a job as applied.
 */
export async function markApplied(uid: string, jobId: string): Promise<void> {
  try {
    await userRef(uid).collection('appliedJobs').doc(jobId).set({
      appliedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[user-service] markApplied error:', err);
  }
}

/**
 * Remove the applied marker from a job.
 */
export async function unmarkApplied(uid: string, jobId: string): Promise<void> {
  try {
    await userRef(uid).collection('appliedJobs').doc(jobId).delete();
  } catch (err) {
    console.error('[user-service] unmarkApplied error:', err);
  }
}

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

/**
 * Return the user's settings, falling back to defaults.
 */
export async function getUserSettings(uid: string): Promise<Settings> {
  try {
    const snap = await userRef(uid).collection('settings').doc('data').get();
    if (!snap.exists) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<Settings>) };
  } catch (err) {
    console.error('[user-service] getUserSettings error:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Persist user settings (merged).
 */
export async function saveUserSettings(uid: string, settings: Partial<Settings>): Promise<void> {
  try {
    await userRef(uid).collection('settings').doc('data').set(settings, { merge: true });
  } catch (err) {
    console.error('[user-service] saveUserSettings error:', err);
  }
}

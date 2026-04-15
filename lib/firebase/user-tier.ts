/**
 * User subscription tier management.
 *
 * Tiers:   free | starter | pro | team
 * Source:  Firestore  users/{uid}/subscription  (field: tier)
 * Default: 'free' when no document exists or Firebase is not configured.
 *
 * TIER_LIMITS maps each tier to per-action monthly caps.
 * A limit of -1 means unlimited.
 */

import { getAdminDb } from './admin';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type Tier = 'free' | 'starter' | 'pro' | 'team';

export type RateLimitedAction = 'cv_generation' | 'cover_letter' | 'job_search';

export type TierLimits = Record<RateLimitedAction, number>;

// ─────────────────────────────────────────────────────────────
// Limits table
// ─────────────────────────────────────────────────────────────

/**
 * Monthly request caps per tier per action.
 * -1 = unlimited.
 */
export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    cv_generation: 3,
    cover_letter:  3,
    job_search:    50,
  },
  starter: {
    cv_generation: 15,
    cover_letter:  15,
    job_search:    200,
  },
  pro: {
    cv_generation: -1,
    cover_letter:  -1,
    job_search:    -1,
  },
  team: {
    cv_generation: -1,
    cover_letter:  -1,
    job_search:    -1,
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

function isTier(value: unknown): value is Tier {
  return value === 'free' || value === 'starter' || value === 'pro' || value === 'team';
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Resolve the subscription tier for a given uid.
 *
 * Reads from:  users/{uid}/subscription  (document, field: tier)
 *
 * Falls back to 'free' when:
 *   - Firebase is not configured
 *   - The document does not exist
 *   - The stored value is not a recognised tier string
 *   - Any Firestore error occurs
 */
export async function getUserTier(uid: string): Promise<Tier> {
  if (!isFirebaseConfigured()) {
    return 'free';
  }

  try {
    const db   = getAdminDb();
    const snap = await db.collection('users').doc(uid).collection('subscription').doc('data').get();

    if (!snap.exists) return 'free';

    const data = snap.data();
    const tier = data?.tier;

    return isTier(tier) ? tier : 'free';
  } catch (err) {
    console.error('[user-tier] getUserTier error:', err);
    return 'free';
  }
}

/**
 * Return the monthly limit for a specific tier + action combination.
 * -1 means unlimited.
 */
export function getLimitForTier(tier: Tier, action: RateLimitedAction): number {
  return TIER_LIMITS[tier][action];
}

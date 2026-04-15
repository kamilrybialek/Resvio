/**
 * In-memory rate limiter keyed by (uid, action).
 *
 * Uses a module-level singleton Map so the counter persists across requests
 * within the same server process (Node.js / long-lived Vercel functions).
 *
 * checkRateLimit(uid, action, limit, windowMs): boolean
 *   Returns true  → request is allowed (counter incremented)
 *   Returns false → limit exceeded, request should be rejected
 *
 * For a limit of -1 the function always returns true (unlimited tier).
 *
 * NOTE: This is a best-effort, single-instance guard. For a distributed
 * deployment (multiple replicas) replace the Map with a Redis/Upstash store.
 */

import { createRateLimitKey } from './security';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BucketEntry {
  count:     number;
  resetAt:   number; // epoch ms when the window expires
}

// ─────────────────────────────────────────────────────────────
// Singleton store
// ─────────────────────────────────────────────────────────────

/** Module-level singleton — survives across requests in the same process. */
const store = new Map<string, BucketEntry>();

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function now(): number {
  return Date.now();
}

/**
 * Remove expired entries to prevent unbounded memory growth.
 * Called lazily on every checkRateLimit invocation.
 */
function pruneExpired(): void {
  const t = now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < t) {
      store.delete(key);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Check (and consume) one unit of the rate-limit budget for uid+action.
 *
 * @param uid       Verified Firebase uid (never client-supplied raw string)
 * @param action    One of: 'cv_generation' | 'cover_letter' | 'job_search'
 * @param limit     Maximum allowed calls within windowMs.  -1 = unlimited.
 * @param windowMs  Sliding window length in milliseconds (default: 1 month)
 * @returns         true if the request may proceed, false if it is over-limit.
 */
export function checkRateLimit(
  uid:      string,
  action:   string,
  limit:    number,
  windowMs: number = 30 * 24 * 60 * 60 * 1000, // ~1 month
): boolean {
  // Unlimited tier — always allow
  if (limit === -1) return true;

  pruneExpired();

  const key   = createRateLimitKey(uid, action);
  const t     = now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < t) {
    // No bucket or expired window → start fresh, consume 1
    store.set(key, { count: 1, resetAt: t + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    // Over budget
    return false;
  }

  // Consume one unit
  entry.count += 1;
  return true;
}

/**
 * Return remaining budget for a uid+action without consuming a unit.
 * Returns Infinity if limit is -1 (unlimited).
 */
export function getRemainingBudget(
  uid:      string,
  action:   string,
  limit:    number,
): number {
  if (limit === -1) return Infinity;

  const key   = createRateLimitKey(uid, action);
  const t     = now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < t) return limit;

  return Math.max(0, limit - entry.count);
}

/**
 * Reset the counter for a specific uid+action (useful in tests or admin flows).
 */
export function resetRateLimit(uid: string, action: string): void {
  store.delete(createRateLimitKey(uid, action));
}

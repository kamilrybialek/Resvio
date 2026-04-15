/**
 * Security utilities for Firebase-aware API routes.
 *
 * sanitizeInput  — strip dangerous characters from user-supplied strings
 * validateJobId  — allow only alphanumeric + dash job identifiers
 * validateMarketId — verify against the known MarketId union
 * createRateLimitKey — compose a stable key for the rate-limiter map
 */

import type { MarketId } from '@/lib/markets';

const KNOWN_MARKET_IDS: ReadonlySet<MarketId> = new Set<MarketId>([
  'scandinavia',
  'uk',
  'central_europe',
  'southern_europe',
  'all_europe',
]);

/**
 * Strip characters that could be used for injection attacks and truncate.
 * Keeps printable ASCII and common European Unicode letters/punctuation.
 * Control characters, angle brackets, backticks and null bytes are removed.
 */
export function sanitizeInput(str: string, maxLength: number): string {
  return str
    .replace(/[\x00-\x1F\x7F<>`]/g, '') // control chars + dangerous html/template chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Job IDs must contain only lowercase/uppercase letters, digits and hyphens.
 * This prevents path traversal and Firestore injection via document IDs.
 */
export function validateJobId(id: string): boolean {
  return /^[A-Za-z0-9-]+$/.test(id) && id.length > 0 && id.length <= 128;
}

/**
 * Market IDs must be one of the values in the MarketId union type.
 */
export function validateMarketId(id: string): id is MarketId {
  return KNOWN_MARKET_IDS.has(id as MarketId);
}

/**
 * Compose a deterministic key for the rate-limiter Map.
 * Neither uid nor action should contain the separator character (|).
 */
export function createRateLimitKey(uid: string, action: string): string {
  // Sanitise segments so a crafted uid cannot collide with another user's key
  const safeUid    = uid.replace(/[|]/g, '_');
  const safeAction = action.replace(/[|]/g, '_');
  return `${safeUid}|${safeAction}`;
}

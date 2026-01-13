/**
 * Token utilities
 *
 * Simple token management using timestamp for expiration check
 * Backend JWT tokens expire in 1 hour
 */

const TOKEN_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check if token is expired based on saved timestamp
 * @param tokenTimestamp - Timestamp when token was saved (from getTokenTimestamp)
 */
export function isTokenExpired(tokenTimestamp: number): boolean {
  const now = Date.now();
  return now - tokenTimestamp > TOKEN_EXPIRATION_TIME;
}

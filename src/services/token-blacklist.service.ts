// Simple token blacklist service for testing purposes
// In production, this would use Redis or a database

interface BlacklistedToken {
  token: string;
  expiresAt: number; // Unix timestamp when token expires
  userId?: string; // For potential future features - logout all devices
}

// In-memory storage for blacklisted tokens
const blacklistedTokens: BlacklistedToken[] = [];

/**
 * Adds a token to the blacklist
 * @param token - The token to blacklist
 * @param expiresAt - Unix timestamp when the token expires
 * @param userId - Optional user ID for tracking
 */
export function blacklistToken(token: string, expiresAt: number, userId?: string): void {
  // Remove token if it already exists
  removeFromBlacklist(token);

  blacklistedTokens.push({
    token,
    expiresAt,
    userId,
  });

  // Clean up expired tokens periodically
  cleanupExpiredTokens();
}

/**
 * Checks if a token is blacklisted
 * @param token - The token to check
 * @returns true if token is blacklisted, false otherwise
 */
export function isTokenBlacklisted(token: string): boolean {
  // Clean up expired tokens first
  cleanupExpiredTokens();

  return blacklistedTokens.some((entry) => entry.token === token);
}

/**
 * Removes a token from the blacklist
 * @param token - The token to remove
 */
export function removeFromBlacklist(token: string): void {
  const index = blacklistedTokens.findIndex((entry) => entry.token === token);
  if (index !== -1) {
    blacklistedTokens.splice(index, 1);
  }
}

/**
 * Removes all tokens for a specific user
 * @param userId - The user ID
 */
export function blacklistAllUserTokens(userId: string): void {
  const userTokens = blacklistedTokens.filter((entry) => entry.userId === userId);
  userTokens.forEach((entry) => removeFromBlacklist(entry.token));
}

/**
 * Cleans up expired tokens from the blacklist
 * This is called automatically but can be called manually if needed
 */
export function cleanupExpiredTokens(): void {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const initialLength = blacklistedTokens.length;

  // Remove expired tokens
  for (let i = blacklistedTokens.length - 1; i >= 0; i--) {
    if (blacklistedTokens[i].expiresAt < now) {
      blacklistedTokens.splice(i, 1);
    }
  }

  // log cleanup if many tokens were removed
  if (blacklistedTokens.length < initialLength) {
    console.log(
      `Cleaned up ${initialLength - blacklistedTokens.length} expired tokens from blacklist`
    );
  }
}

/**
 * Gets the current size of the blacklist
 */
export function getBlacklistSize(): number {
  cleanupExpiredTokens();
  return blacklistedTokens.length;
}


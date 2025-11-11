/**
 * Token Blacklist Service
 * In-memory implementation for token invalidation
 * For production, use Redis for distributed systems
 */

class TokenBlacklist {
  constructor() {
    this.blacklist = new Set();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Add a token to the blacklist with expiration
   * @param {string} token - The JWT token to blacklist
   * @param {number} expiresIn - Time in milliseconds until token expires
   */
  add(token, expiresIn) {
    const entry = {
      token,
      expiresAt: Date.now() + expiresIn
    };
    this.blacklist.add(JSON.stringify(entry));
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - The token to check
   * @returns {boolean}
   */
  isBlacklisted(token) {
    for (const entry of this.blacklist) {
      const parsed = JSON.parse(entry);
      if (parsed.token === token && parsed.expiresAt > Date.now()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Remove expired tokens from blacklist
   */
  cleanup() {
    const now = Date.now();
    for (const entry of this.blacklist) {
      const parsed = JSON.parse(entry);
      if (parsed.expiresAt <= now) {
        this.blacklist.delete(entry);
      }
    }
  }

  /**
   * Start automatic cleanup every hour
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Get blacklist size (for monitoring)
   */
  size() {
    return this.blacklist.size;
  }
}

// Export singleton instance
module.exports = new TokenBlacklist();

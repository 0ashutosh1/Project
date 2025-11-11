/**
 * Audit Logger
 * Structured logging for authentication and security events
 */

const { v4: uuidv4 } = require('uuid');

class AuditLogger {
  constructor() {
    this.logs = [];
  }

  /**
   * Log an authentication event
   * @param {Object} event - Event details
   */
  logAuth(event) {
    const logEntry = {
      correlationId: event.correlationId || uuidv4(),
      timestamp: new Date().toISOString(),
      eventType: event.type, // 'login', 'logout', 'register', 'token_refresh', 'link_account'
      provider: event.provider, // 'google', 'github', 'facebook'
      userId: event.userId,
      email: event.email,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success,
      errorMessage: event.errorMessage,
      metadata: event.metadata || {}
    };

    this.logs.push(logEntry);
    
    // Console output for development
    if (event.success) {
      console.log(`✅ [AUTH] ${event.type.toUpperCase()} - User: ${event.email || event.userId} - Provider: ${event.provider || 'N/A'} - ID: ${logEntry.correlationId}`);
    } else {
      console.error(`❌ [AUTH] ${event.type.toUpperCase()} FAILED - User: ${event.email || event.userId} - Reason: ${event.errorMessage} - ID: ${logEntry.correlationId}`);
    }

    // In production, send to logging service (e.g., Winston, Datadog, CloudWatch)
    return logEntry.correlationId;
  }

  /**
   * Log a security event
   * @param {Object} event - Security event details
   */
  logSecurity(event) {
    const logEntry = {
      correlationId: event.correlationId || uuidv4(),
      timestamp: new Date().toISOString(),
      eventType: 'SECURITY',
      securityEvent: event.type, // 'csrf_attack', 'rate_limit', 'invalid_token', 'replay_attack'
      severity: event.severity || 'medium', // 'low', 'medium', 'high', 'critical'
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details,
      userId: event.userId
    };

    this.logs.push(logEntry);
    console.warn(`⚠️ [SECURITY] ${event.type.toUpperCase()} - Severity: ${event.severity} - IP: ${event.ip} - ID: ${logEntry.correlationId}`);
    
    return logEntry.correlationId;
  }

  /**
   * Get logs by correlation ID
   * @param {string} correlationId
   * @returns {Array}
   */
  getLogsByCorrelationId(correlationId) {
    return this.logs.filter(log => log.correlationId === correlationId);
  }

  /**
   * Get logs by user ID
   * @param {string} userId
   * @returns {Array}
   */
  getLogsByUserId(userId) {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get recent logs
   * @param {number} limit - Number of logs to return
   * @returns {Array}
   */
  getRecentLogs(limit = 100) {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs count by event type
   * @returns {Object}
   */
  getMetrics() {
    const metrics = {};
    this.logs.forEach(log => {
      const key = log.eventType;
      metrics[key] = (metrics[key] || 0) + 1;
    });
    return metrics;
  }
}

// Export singleton instance
module.exports = new AuditLogger();

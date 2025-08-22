/**
 * Logging Utility - Configurable Application Logging
 * 
 * This module provides a centralized logging system with configurable debug levels.
 * It supports both production logging (essential information) and debug logging
 * (detailed information for troubleshooting).
 * 
 * Key features:
 * - Environment-based configuration
 * - Debug mode toggle via DEBUG environment variable
 * - Consistent log formatting with timestamps
 * - Different log levels (info, warn, error, debug)
 * - Production-safe (debug logs only appear when enabled)
 * 
 * Usage:
 * ```typescript
 * import { logger } from '../utils/logger'
 * 
 * logger.info('Application started')
 * logger.debug('User authentication attempt', { email: user.email })
 * logger.error('Database connection failed', error)
 * logger.warn('Rate limit exceeded for IP', { ip: req.ip })
 * ```
 * 
 * Configuration:
 * - Set DEBUG=true in .env file to enable debug logging
 * - Set NODE_ENV=production to use production log format
 */

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Logger Configuration
 * 
 * Determines logging behavior based on environment variables:
 * - DEBUG: Enables detailed debug logging when set to 'true'
 * - NODE_ENV: Affects log formatting (production vs development)
 */
const config = {
  // Enable debug logging if DEBUG=true in environment
  debug: process.env.DEBUG === 'true',
  
  // Use more verbose logging in development
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // Application name for log prefixing
  appName: 'PartyCollection',
}

/**
 * Format timestamp for log entries
 * 
 * @returns ISO timestamp string for consistent log formatting
 */
const getTimestamp = (): string => {
  return new Date().toISOString()
}

/**
 * Format log message with metadata
 * 
 * @param level - Log level (INFO, DEBUG, WARN, ERROR)
 * @param message - Primary log message
 * @param meta - Optional metadata object or error
 * @returns Formatted log string
 */
const formatMessage = (level: string, message: string, meta?: any): string => {
  const timestamp = getTimestamp()
  const prefix = `[${timestamp}] [${config.appName}] [${level}]`
  
  if (meta) {
    // If meta is an Error object, include stack trace in development
    if (meta instanceof Error) {
      const errorInfo = config.isDevelopment ? meta.stack : meta.message
      return `${prefix} ${message}: ${errorInfo}`
    }
    
    // If meta is an object, stringify it for logging
    if (typeof meta === 'object') {
      try {
        const metaString = JSON.stringify(meta, null, config.isDevelopment ? 2 : 0)
        return `${prefix} ${message} ${metaString}`
      } catch (e) {
        return `${prefix} ${message} [Unable to serialize metadata]`
      }
    }
    
    // For primitive values, just append them
    return `${prefix} ${message}: ${meta}`
  }
  
  return `${prefix} ${message}`
}

/**
 * Logger Interface
 * 
 * Provides consistent logging methods with automatic formatting
 * and conditional debug output based on configuration.
 */
export const logger = {
  /**
   * Log informational messages
   * 
   * Used for normal application flow and important events.
   * Always displayed regardless of debug setting.
   * 
   * @param message - Log message
   * @param meta - Optional metadata
   */
  info: (message: string, meta?: any): void => {
    console.log(formatMessage('INFO', message, meta))
  },

  /**
   * Log warning messages
   * 
   * Used for recoverable errors or concerning situations.
   * Always displayed regardless of debug setting.
   * 
   * @param message - Warning message
   * @param meta - Optional metadata
   */
  warn: (message: string, meta?: any): void => {
    console.warn(formatMessage('WARN', message, meta))
  },

  /**
   * Log error messages
   * 
   * Used for serious errors that need attention.
   * Always displayed regardless of debug setting.
   * 
   * @param message - Error message
   * @param meta - Optional error object or metadata
   */
  error: (message: string, meta?: any): void => {
    console.error(formatMessage('ERROR', message, meta))
  },

  /**
   * Log debug messages
   * 
   * Used for detailed troubleshooting information.
   * Only displayed when DEBUG=true in environment.
   * 
   * Includes detailed information such as:
   * - Request/response data
   * - Database query details
   * - Authentication flow steps
   * - Variable values during execution
   * 
   * @param message - Debug message
   * @param meta - Optional detailed metadata
   */
  debug: (message: string, meta?: any): void => {
    if (config.debug) {
      console.log(formatMessage('DEBUG', message, meta))
    }
  },

  /**
   * Check if debug logging is enabled
   * 
   * Useful for conditionally performing expensive operations
   * only when debug logging is active.
   * 
   * @returns True if debug logging is enabled
   */
  isDebugEnabled: (): boolean => {
    return config.debug
  },

  /**
   * Log database operations (debug level)
   * 
   * Specialized logging for database queries and operations.
   * Only displayed when DEBUG=true.
   * 
   * @param operation - Database operation description
   * @param query - SQL query or operation details
   * @param params - Query parameters (will be sanitized)
   */
  database: (operation: string, query: string, params?: any[]): void => {
    if (config.debug) {
      const sanitizedParams = params ? params.map(p => 
        typeof p === 'string' && p.length > 50 ? '[LONG_STRING]' : p
      ) : undefined
      
      logger.debug(`Database ${operation}`, {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        params: sanitizedParams
      })
    }
  },

  /**
   * Log HTTP requests (debug level)
   * 
   * Specialized logging for HTTP request processing.
   * Only displayed when DEBUG=true.
   * 
   * @param method - HTTP method
   * @param path - Request path
   * @param userId - User ID if authenticated
   * @param meta - Additional request metadata
   */
  request: (method: string, path: string, userId?: string, meta?: any): void => {
    if (config.debug) {
      logger.debug(`${method} ${path}`, {
        userId: userId || 'anonymous',
        ...meta
      })
    }
  }
}

/**
 * Export configuration for testing and inspection
 */
export const loggerConfig = config
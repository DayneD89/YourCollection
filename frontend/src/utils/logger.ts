/**
 * Frontend Logging Utility - Configurable Browser Logging
 * 
 * This module provides a centralized logging system for the frontend with configurable
 * debug levels. It's designed for browser environments and integrates with React
 * development tools and production monitoring.
 * 
 * Key features:
 * - Environment-based configuration via NEXT_PUBLIC_DEBUG
 * - Debug mode toggle for detailed frontend troubleshooting
 * - Browser-optimized logging with proper formatting
 * - React-specific logging for components and hooks
 * - Authentication flow and API request logging
 * - Production-safe (debug logs only appear when enabled)
 * 
 * Usage:
 * ```typescript
 * import { logger } from '@/utils/logger'
 * 
 * logger.info('Component mounted', { componentName: 'Dashboard' })
 * logger.debug('State updated', { newState: userData })
 * logger.error('API request failed', error)
 * logger.warn('Deprecated prop used', { prop: 'oldProp' })
 * ```
 * 
 * Configuration:
 * - Set NEXT_PUBLIC_DEBUG=true in .env.local to enable debug logging
 * - Debug logs appear in browser DevTools console
 * - Production builds automatically disable debug logging for performance
 */

/**
 * Logger Configuration
 * 
 * Determines logging behavior based on environment variables:
 * - NEXT_PUBLIC_DEBUG: Enables detailed debug logging when set to 'true'
 * - NODE_ENV: Affects log formatting and available features
 */
const config = {
  // Enable debug logging if NEXT_PUBLIC_DEBUG=true in environment
  debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
  
  // Use more verbose logging in development
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // Application name for log prefixing
  appName: 'PartyCollectionFE',
  
  // Console styling for better visibility in DevTools
  styles: {
    info: 'color: #2196F3; font-weight: bold;',
    warn: 'color: #FF9800; font-weight: bold;',
    error: 'color: #F44336; font-weight: bold;',
    debug: 'color: #9C27B0; font-weight: bold;',
    timestamp: 'color: #666; font-size: 11px;',
    component: 'color: #4CAF50; font-weight: bold;'
  }
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
 * Format log message with metadata for browser console
 * 
 * @param level - Log level (INFO, DEBUG, WARN, ERROR)
 * @param message - Primary log message
 * @param meta - Optional metadata object or error
 * @returns Array of [message, style, metadata] for console logging
 */
const formatMessage = (level: string, message: string, meta?: unknown): [string, string, unknown?] => {
  const timestamp = getTimestamp()
  const prefix = `[${timestamp}] [${config.appName}] [${level}]`
  const style = config.styles[level.toLowerCase() as keyof typeof config.styles] || ''
  
  if (meta) {
    return [`%c${prefix} ${message}`, style, meta]
  }
  
  return [`%c${prefix} ${message}`, style]
}

/**
 * Check if we're in a browser environment
 * This prevents errors during SSR (Server-Side Rendering)
 */
const isBrowser = typeof window !== 'undefined'

/**
 * Frontend Logger Interface
 * 
 * Provides consistent logging methods with browser-optimized formatting
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
  info: (message: string, meta?: unknown): void => {
    if (!isBrowser) return
    
    const [formattedMessage, style, metadata] = formatMessage('INFO', message, meta)
    if (metadata) {
      console.log(formattedMessage, style, metadata)
    } else {
      console.log(formattedMessage, style)
    }
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
  warn: (message: string, meta?: unknown): void => {
    if (!isBrowser) return
    
    const [formattedMessage, style, metadata] = formatMessage('WARN', message, meta)
    if (metadata) {
      console.warn(formattedMessage, style, metadata)
    } else {
      console.warn(formattedMessage, style)
    }
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
  error: (message: string, meta?: unknown): void => {
    if (!isBrowser) return
    
    const [formattedMessage, style, metadata] = formatMessage('ERROR', message, meta)
    if (metadata) {
      console.error(formattedMessage, style, metadata)
    } else {
      console.error(formattedMessage, style)
    }
  },

  /**
   * Log debug messages
   * 
   * Used for detailed troubleshooting information.
   * Only displayed when NEXT_PUBLIC_DEBUG=true in environment.
   * 
   * Includes detailed information such as:
   * - Component lifecycle events
   * - State changes and updates
   * - API request/response details
   * - Authentication flow steps
   * - Form validation processes
   * 
   * @param message - Debug message
   * @param meta - Optional detailed metadata
   */
  debug: (message: string, meta?: unknown): void => {
    if (!isBrowser || !config.debug) return
    
    const [formattedMessage, style, metadata] = formatMessage('DEBUG', message, meta)
    if (metadata) {
      console.log(formattedMessage, style, metadata)
    } else {
      console.log(formattedMessage, style)
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
   * Log React component lifecycle events (debug level)
   * 
   * Specialized logging for React component mounting, updating, and unmounting.
   * Only displayed when NEXT_PUBLIC_DEBUG=true.
   * 
   * @param componentName - Name of the React component
   * @param event - Lifecycle event (mount, update, unmount)
   * @param props - Optional component props or state
   */
  component: (componentName: string, event: 'mount' | 'update' | 'unmount', props?: Record<string, unknown>): void => {
    if (!isBrowser || !config.debug) return
    
    const message = `Component ${componentName} ${event}`
    const [formattedMessage, , metadata] = formatMessage('DEBUG', message, props)
    
    if (metadata) {
      console.log(`%c${formattedMessage}`, config.styles.component, metadata)
    } else {
      console.log(`%c${formattedMessage}`, config.styles.component)
    }
  },

  /**
   * Log API requests and responses (debug level)
   * 
   * Specialized logging for HTTP requests to track API communication.
   * Only displayed when NEXT_PUBLIC_DEBUG=true.
   * 
   * @param method - HTTP method (GET, POST, etc.)
   * @param url - Request URL (will be truncated if very long)
   * @param status - Response status code (optional)
   * @param meta - Additional request/response metadata
   */
  api: (method: string, url: string, status?: number, meta?: unknown): void => {
    if (!isBrowser || !config.debug) return
    
    // Truncate very long URLs for readability
    const displayUrl = url.length > 60 ? url.substring(0, 60) + '...' : url
    const message = status 
      ? `API ${method} ${displayUrl} [${status}]`
      : `API ${method} ${displayUrl}`
    
    logger.debug(message, meta)
  },

  /**
   * Log authentication events (debug level)
   * 
   * Specialized logging for authentication flow tracking.
   * Only displayed when NEXT_PUBLIC_DEBUG=true.
   * 
   * @param event - Authentication event description
   * @param userInfo - User information (will be sanitized)
   */
  auth: (event: string, userInfo?: Record<string, unknown>): void => {
    if (!isBrowser || !config.debug) return
    
    // Sanitize user info to avoid logging sensitive data
    const sanitizedInfo = userInfo ? {
      userId: userInfo.id || 'unknown',
      email: userInfo.email || 'unknown',
      role: userInfo.role || 'unknown'
    } : undefined
    
    logger.debug(`Auth: ${event}`, sanitizedInfo)
  },

  /**
   * Log form events (debug level)
   * 
   * Specialized logging for form interactions and validation.
   * Only displayed when NEXT_PUBLIC_DEBUG=true.
   * 
   * @param formName - Name/ID of the form
   * @param event - Form event (submit, validate, error)
   * @param data - Form data (will be sanitized to avoid logging passwords)
   */
  form: (formName: string, event: string, data?: Record<string, unknown>): void => {
    if (!isBrowser || !config.debug) return
    
    // Sanitize form data to avoid logging passwords
    let sanitizedData: unknown = data
    if (data && typeof data === 'object' && data !== null) {
      const dataObject = data as Record<string, unknown>
      sanitizedData = { ...dataObject }
      // Remove password fields from logging
      Object.keys(dataObject).forEach(key => {
        if (key.toLowerCase().includes('password')) {
          (sanitizedData as Record<string, unknown>)[key] = '[HIDDEN]'
        }
      })
    }
    
    logger.debug(`Form ${formName}: ${event}`, sanitizedData)
  },

  /**
   * Log React hook usage (debug level)
   * 
   * Specialized logging for React hooks like useState, useEffect.
   * Only displayed when NEXT_PUBLIC_DEBUG=true.
   * 
   * @param hookName - Name of the hook (useState, useEffect, etc.)
   * @param componentName - Component using the hook
   * @param details - Hook-specific details
   */
  hook: (hookName: string, componentName: string, details?: Record<string, unknown>): void => {
    if (!isBrowser || !config.debug) return
    
    logger.debug(`Hook ${hookName} in ${componentName}`, details)
  }
}

/**
 * Export configuration for testing and inspection
 */
export const loggerConfig = config
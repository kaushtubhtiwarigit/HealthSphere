/**
 * Centralized logging utility for better debugging and monitoring
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('Failed to fetch data', error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isClient = typeof window !== 'undefined'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const env = this.isClient ? '[Client]' : '[Server]'
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    return `${timestamp} ${env} [${level.toUpperCase()}] ${message}${contextStr}`
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context))
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context))
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...context }
      : { error, ...context }
    
    console.error(this.formatMessage('error', message, errorDetails))
  }

  /**
   * Log API requests (for API routes)
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context)
  }

  /**
   * Log API responses (for API routes)
   */
  apiResponse(method: string, path: string, status: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : 'info'
    this[level](`API ${method} ${path} - ${status}`, context)
  }

  /**
   * Log database operations
   */
  dbOperation(operation: string, collection: string, context?: LogContext): void {
    this.debug(`DB ${operation} on ${collection}`, context)
  }

  /**
   * Log authentication events
   */
  auth(event: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, context)
  }

  /**
   * Create a child logger with a specific context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger()
    const originalMethods = {
      debug: childLogger.debug.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
    }

    childLogger.debug = (message: string, context?: LogContext) => 
      originalMethods.debug(message, { ...defaultContext, ...context })
    childLogger.info = (message: string, context?: LogContext) => 
      originalMethods.info(message, { ...defaultContext, ...context })
    childLogger.warn = (message: string, context?: LogContext) => 
      originalMethods.warn(message, { ...defaultContext, ...context })
    childLogger.error = (message: string, error?: Error | unknown, context?: LogContext) => 
      originalMethods.error(message, error, { ...defaultContext, ...context })

    return childLogger
  }
}

// Export singleton instance
export const logger = new Logger()

// Export function to create contextual loggers
export function createLogger(context: LogContext): Logger {
  return logger.child(context)
}

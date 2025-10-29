/**
 * Logger Registry
 * 
 * Global registry for managing and retrieving logger instances by name
 * Allows accessing loggers from anywhere in your application
 */

import type { Logger } from './Logger';
import type { LogLevel } from './levels';
import type { Transport } from './types';
import { Logger as LoggerClass } from './Logger';

export interface RegistryLoggerOptions {
  name?: string;
  level?: LogLevel;
  transport?: Transport;
}

/**
 * Global Logger Registry
 * 
 * Singleton pattern to manage logger instances across the application
 */
class LoggerRegistry {
  private static instance: LoggerRegistry;
  private loggers = new Map<string, Logger>();

  private constructor() {}

  static getInstance(): LoggerRegistry {
    if (!LoggerRegistry.instance) {
      LoggerRegistry.instance = new LoggerRegistry();
    }
    return LoggerRegistry.instance;
  }

  /**
   * Get or create a logger by name (functional approach).
   * 
   * This follows the syntropyLog pattern: if the logger exists, return it;
   * if not, create a new one with default options and cache it automatically.
   */
  getLogger(name: string, options?: RegistryLoggerOptions): Logger {
    // Guard clause: Logger already exists - return cached instance
    if (this.loggers.has(name)) {
      return this.loggers.get(name)!;
    }

    // Create and register new logger (functional: immutable creation)
    const logger = new LoggerClass(
      name,
      options?.transport,
      options?.level ?? 'info'
    );

    this.loggers.set(name, logger);
    return logger;
  }

  /**
   * Get all registered logger names
   */
  getLoggerNames(): string[] {
    return Array.from(this.loggers.keys());
  }

  /**
   * Check if a logger exists
   */
  hasLogger(name: string): boolean {
    return this.loggers.has(name);
  }

  /**
   * Remove a logger from the registry
   */
  removeLogger(name: string): boolean {
    return this.loggers.delete(name);
  }

  /**
   * Clear all loggers
   */
  clear(): void {
    this.loggers.clear();
  }

  /**
   * Get all loggers (for testing/debugging)
   * Returns an object with logger names as keys (functional approach)
   */
  getAllLoggers(): Record<string, Logger> {
    return Object.fromEntries(this.loggers.entries());
  }
}

// Export singleton instance
export const loggerRegistry = LoggerRegistry.getInstance();

/**
 * Convenience functions for global access
 */

/**
 * Get a logger by name from anywhere in the app
 * 
 * Automatically creates the logger if it doesn't exist.
 * Registration is completely internal and transparent.
 * 
 * @example
 * ```typescript
 * import { getLogger } from '@syntrojs/logger/registry';
 * 
 * // First call: creates logger with default options
 * const dbLogger = getLogger('database');
 * dbLogger.info('Query executed');
 * 
 * // Second call in different file: returns same instance
 * import { getLogger } from '@syntrojs/logger/registry';
 * const logger = getLogger('database');
 * logger.info('Another query'); // Same instance
 * 
 * // With custom options (only on first call)
 * const apiLogger = getLogger('api', { level: 'debug', transport: 'json' });
 * ```
 */
export function getLogger(name: string, options?: RegistryLoggerOptions): Logger {
  return loggerRegistry.getLogger(name, options);
}


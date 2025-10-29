/**
 * Core Logger implementation
 * 
 * Provides a fast, simple logging API inspired by Pino but even more lightweight
 */

import * as util from 'node:util';
import type { Transport, LogFormatArg, LogMetadata, JsonValue } from './types';
import type { LogLevel } from './levels';
import { isLevelEnabled } from './levels';
import { JsonTransport } from './transports/json';
import { AsyncContext } from './context/Context';

export interface LoggerBindings {
  [key: string]: unknown;
}

/**
 * Core Logger class
 */
export class Logger {
  public level: LogLevel;
  public name: string;
  private transport: Transport;
  private bindings: LoggerBindings;
  private serviceName: string; // Cache service name for faster access
  private useAsyncContext = true;

  /**
   * Disable async context lookup for this logger instance for max performance.
   * Useful for high-performance scenarios where you don't need correlation IDs.
   * @returns {this} The logger instance for chaining.
   */
  withoutContext(): this {
    this.useAsyncContext = false;
    return this;
  }

  constructor(
    name: string,
    transport: Transport = new JsonTransport(), // JSON is the default - ultrafast!
    level: LogLevel = 'info',
    bindings: LoggerBindings = {}
  ) {
    this.name = name;
    this.serviceName = name; // Cache for faster property access
    this.transport = transport;
    this.level = level;
    this.bindings = bindings;
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    ...args: (LogFormatArg | LogMetadata | JsonValue)[]
  ): void {
    // Quick exit if level is not enabled
    if (!isLevelEnabled(level, this.level)) {
      return;
    }

    // Parse arguments following Pino-like signature
    let message = '';
    let metadata: LogMetadata = {};

    if (args.length > 0) {
      // Check if first argument is an object (metadata)
      const firstArg = args[0];
      
      if (
        typeof firstArg === 'object' &&
        firstArg !== null &&
        !Array.isArray(firstArg)
      ) {
        // First arg is metadata: logger.info({ userId: 123 }, 'User logged in')
        metadata = firstArg as LogMetadata;
        message = (args[1] as string) || '';
        const formatArgs = args.slice(2);
        
        if (message && formatArgs.length > 0) {
          message = util.format(message, ...formatArgs);
        }
      } else {
        // First arg is message: logger.info('User logged in', userId)
        message = String(firstArg || '');
        const formatArgs = args.slice(1);
        
        if (message && formatArgs.length > 0) {
          message = util.format(message, ...formatArgs);
        }
      }
    }

    // --- Performance Optimization ---
    // Conditionally check for async context to avoid overhead in hot paths
    let store: Map<string, unknown> | undefined;
    let hasContext = false;
    if (this.useAsyncContext) {
      store = AsyncContext['storage'].getStore();
      hasContext = !!store && store.size > 0;
    }
    
    // Guard clause: Check if we have any additional data to add
    const hasBindings = this.bindings && Object.keys(this.bindings).length > 0;
    const hasMetadata = Object.keys(metadata).length > 0;
    
    // Fast path: No context, no bindings, no metadata - just core fields
    if (!hasContext && !hasBindings && !hasMetadata) {
      const time = new Date().toISOString();
      const json = `{"time":"${time}","level":"${level}","message":${JSON.stringify(message)},"service":"${this.serviceName}"}`;
      try {
        this.transport.log(json);
      } catch (error) {
        console.error('[Logger Error] Failed to write log:', error);
      }
      return;
    }
    
    // Pino-style: Build JSON string manually - minimal object creation!
    const time = new Date().toISOString(); // Use ISO string for clarity
    const levelStr = `"${level}"`;
    const msgStr = JSON.stringify(message);
    const serviceStr = `"${this.serviceName}"`;
    
    // Start with required fields - no spread, no object creation
    let json = `{"time":"${time}","level":${levelStr},"message":${msgStr},"service":${serviceStr}`;
    
    // Add async context fields inline - no function call overhead
    if (hasContext) {
      for (const [key, value] of store!.entries()) {
        if (key && value !== undefined) {
          json += `,"${key}":${JSON.stringify(value)}`;
        }
      }
    }
    
    // Add bindings inline (skip duplicates with context)
    if (this.bindings) {
      for (const key in this.bindings) {
        if (key && this.bindings[key] !== undefined) {
          // Only add if not already in context (context takes precedence)
          if (!hasContext || !store!.has(key)) {
            json += `,"${key}":${JSON.stringify(this.bindings[key])}`;
          }
        }
      }
    }
    
    // Add metadata inline (takes precedence)
    if (metadata) {
      for (const key in metadata) {
        if (key && metadata[key] !== undefined) {
          json += `,"${key}":${JSON.stringify(metadata[key])}`;
        }
      }
    }
    
    json += '}';

    // Write to transport (Silent Observer: never interrupt the app)
    try {
      this.transport.log(json);
    } catch (error) {
      // Log error to console as fallback (only way to report logger failure)
      console.error('[Logger Error] Failed to write log:', error);
    }
  }

  // Public logging methods
  fatal(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('fatal', ...args);
  }

  error(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('error', ...args);
  }

  warn(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('warn', ...args);
  }

  info(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('info', ...args);
  }

  debug(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('debug', ...args);
  }

  trace(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('trace', ...args);
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Create a child logger with additional bindings
   */
  child(bindings: LoggerBindings): Logger {
    return new Logger(
      this.name,
      this.transport,
      this.level,
      { ...this.bindings, ...bindings }
    );
  }

  /**
   * Create a logger with a specific source
   */
  withSource(source: string): Logger {
    return this.child({ source });
  }

  /**
   * Flush buffered logs to transport
   * Useful for graceful shutdown
   */
  async flush(): Promise<void> {
    if (this.transport.flush) {
      await this.transport.flush();
    }
  }

  /**
   * Close transport and cleanup resources
   */
  async close(): Promise<void> {
    if (this.transport.close) {
      await this.transport.close();
    }
  }
}


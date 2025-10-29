/**
 * Base Transport class for extensibility
 * 
 * This provides a solid foundation for custom transports including
 * future OpenTelemetry integration
 */

import type { LogEntry } from '../types';
import type { LogLevel } from '../levels';
import { LOG_LEVEL_WEIGHTS } from '../levels';

export interface TransportOptions {
  level?: LogLevel;
  name?: string;
}

/**
 * Base Transport class
 * 
 * All transports should extend this class for consistency and future features
 */
export class Transport {
  public level: LogLevel;
  public name: string;

  constructor(options: TransportOptions = {}) {
    this.level = options.level || 'trace';
    this.name = options.name || this.constructor.name;
  }

  /**
   * Check if this transport should handle a log entry
   */
  isLevelEnabled(level: LogLevel): boolean {
    if (this.level === 'silent') return false;
    if (level === 'silent') return false;
    return LOG_LEVEL_WEIGHTS[level] >= LOG_LEVEL_WEIGHTS[this.level];
  }

  /**
   * Process and output a log entry
   * Can receive either a LogEntry object or a pre-formatted JSON string
   */
  log(entry: LogEntry | string): void {
    // Default implementation for backwards compatibility
    if (typeof entry === 'string') {
      console.log(entry);
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Optional: Flush any buffered logs
   * Useful for async transports or file writers
   */
  flush?(): void | Promise<void>;

  /**
   * Optional: Cleanup resources
   */
  close?(): void | Promise<void>;
}


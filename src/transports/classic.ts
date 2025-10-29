/**
 * Classic Transport - Log4j-style single-line format
 * Optimized for traditional logging fans
 */

import chalk from 'chalk';
import type { LogEntry, LogLevel } from '../types';
import { Transport, type TransportOptions } from './Transport';

export class ClassicTransport extends Transport {
  private readonly levelColorMap: Record<Exclude<LogLevel, 'silent'>, any>;
  /** Dictionary of console methods by log level (functional approach) */
  private readonly consoleMethodMap: Record<LogLevel, (message: string) => void>;

  constructor(options?: TransportOptions) {
    super(options);
    this.levelColorMap = {
      fatal: chalk.bgRed.white.bold,
      error: chalk.red.bold,
      warn: chalk.yellow.bold,
      info: chalk.green,
      debug: chalk.blue,
      trace: chalk.gray,
    };

    // Functional approach: Dictionary instead of switch statement
    this.consoleMethodMap = {
      fatal: console.error,
      error: console.error,
      warn: console.warn,
      info: console.log,
      debug: console.log,
      trace: console.log,
      silent: console.log, // Should never be called but needed for type safety
    };
  }

  private formatTimestamp(ts: string | number | undefined): string {
    // Guard clause: Handle undefined or invalid timestamps
    if (ts === undefined) {
      return `[${new Date().toISOString()}]`;
    }

    // Guard clause: Validate timestamp before formatting
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) {
      return `[${new Date().toISOString()}]`; // Fallback to current time
    }

    // Convert to ISO string format with brackets
    return `[${date.toISOString()}]`;
  }

  log(entry: LogEntry | string): void {
    // Guard clause: Parse string entry (functional approach)
    const logEntry = this.parseEntry(entry);
    if (!logEntry) {
      return;
    }

    // Guard clause: Level not enabled
    if (!this.isLevelEnabled(logEntry.level)) {
      return;
    }

    const timestamp = (logEntry as any).time || logEntry.timestamp;
    const { level, service = 'app', message, time: _, timestamp: __, ...rest } = logEntry;

    const colorizer = this.levelColorMap[level as Exclude<LogLevel, 'silent'>] || chalk.white;

    // Format timestamp
    const timeStr = this.formatTimestamp(timestamp);

    // Format level with fixed width for alignment
    const levelStr = colorizer(level.toUpperCase().padEnd(5));

    // Format service name
    const serviceStr = chalk.magenta(`[${service}]`);

    // Build log string with message first
    let logString = `${timeStr} ${levelStr} ${serviceStr} - ${message}`;

    // Add metadata after message (only if present) - functional approach
    const metaKeys = Object.keys(rest);
    if (metaKeys.length > 0) {
      const metaStr = chalk.dim(
        ` [${metaKeys.map((key) => `${key}=${JSON.stringify(rest[key])}`).join(' ')}]`
      );
      logString += metaStr;
    }

    // Functional approach: Dictionary lookup instead of switch
    const consoleMethod = this.consoleMethodMap[level] || console.log;
    consoleMethod(logString);
  }

  /**
   * Parse log entry from string or object (Single Responsibility).
   * Returns null if parsing fails.
   * @private
   */
  private parseEntry(entry: LogEntry | string): LogEntry | null {
    // Guard clause: Already an object
    if (typeof entry !== 'string') {
      return entry;
    }

    // Guard clause: Try to parse JSON string
    try {
      return JSON.parse(entry);
    } catch {
      // Fallback: Log raw string and return null
      console.log(entry);
      return null;
    }
  }
}

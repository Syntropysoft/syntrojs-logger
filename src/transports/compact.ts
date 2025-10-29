/**
 * Compact Transport - Single-line logs optimized for readability
 */

import chalk from 'chalk';
import type { LogEntry, LogLevel } from '../types';
import { safeStringify } from '../utils/serialize';
import { Transport, type TransportOptions } from './Transport';

export class CompactTransport extends Transport {
  private readonly levelColorMap: Record<Exclude<LogLevel, 'silent'>, any>;

  constructor(options?: TransportOptions) {
    super(options);
    this.levelColorMap = {
      fatal: chalk.bgRed.white.bold,
      error: chalk.red.bold,
      warn: chalk.yellow.bold,
      info: chalk.cyan.bold,
      debug: chalk.green,
      trace: chalk.gray,
    };
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

    const { level, message, service, timestamp, ...rest } = logEntry;

    const colorizer = this.levelColorMap[level as Exclude<LogLevel, 'silent'>] || chalk.white;

    // Guard clause: Handle invalid timestamps
    const date = timestamp ? new Date(timestamp) : new Date();
    const timeStr = Number.isNaN(date.getTime())
      ? chalk.gray(`[${new Date().toISOString()}]`)
      : chalk.gray(`[${date.toISOString()}]`);
    const levelString = colorizer(`[${level.toUpperCase()}]`);
    const serviceString = service ? chalk.blue(`(${service})`) : '';

    let logString = `${timeStr} ${levelString} ${serviceString}: ${message}`;

    // Add metadata on same line
    const metaKeys = Object.keys(rest);
    if (metaKeys.length > 0) {
      const metaString = metaKeys
        .map((key) => {
          const value = rest[key];
          const formattedValue =
            typeof value === 'object' && value !== null ? safeStringify(value) : value;
          return `${chalk.dim(key)}=${chalk.gray(formattedValue)}`;
        })
        .join(' ');

      logString += ` ${chalk.dim('|')} ${metaString}`;
    }

    console.log(logString);
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

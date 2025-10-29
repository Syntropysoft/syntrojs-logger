/**
 * Classic Transport - Log4j-style single-line format
 * Optimized for traditional logging fans
 */

import chalk from 'chalk';
import type { LogEntry, LogLevel } from '../types';
import { Transport, type TransportOptions } from './Transport';

export class ClassicTransport extends Transport {
  private readonly levelColorMap: Record<Exclude<LogLevel, 'silent'>, any>;

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
  }

private formatTimestamp(ts: string | number): string {
    // Convert to ISO string format with brackets
    return `[${new Date(ts).toISOString()}]`;
}
  
  log(entry: LogEntry | string): void {
    let logEntry: LogEntry;
    
    if (typeof entry === 'string') {
      try {
        logEntry = JSON.parse(entry);
      } catch {
        console.log(entry);
        return;
      }
    } else {
      logEntry = entry;
    }
    
    if (!this.isLevelEnabled(logEntry.level)) {
      return;
    }

    const timestamp = (logEntry as any).time || logEntry.timestamp;
    const { level, service, message, time: _, timestamp: __, ...rest } = logEntry;

    const colorizer = this.levelColorMap[level as Exclude<LogLevel, 'silent'>] || chalk.white;

    // Format timestamp
    const timeStr = this.formatTimestamp(timestamp);

    // Format level with fixed width for alignment
    const levelStr = colorizer(level.toUpperCase().padEnd(5));

    // Format service name
    const serviceStr = chalk.magenta(`[${service}]`);

    // Build log string with message first
    let logString = `${timeStr} ${levelStr} ${serviceStr} - ${message}`;

    // Add metadata after message (only if present)
    const metaKeys = Object.keys(rest);
    if (metaKeys.length > 0) {
      const metaStr = chalk.dim(
        ' [' +
          metaKeys
            .map((key) => `${key}=${JSON.stringify(rest[key])}`)
            .join(' ') +
          ']'
      );
      logString += metaStr;
    }

    // Use appropriate console method
    switch (level) {
      case 'fatal':
      case 'error':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      default:
        console.log(logString);
    }
  }
}


/**
 * Pretty Transport - Human-readable colored output for development
 */

import chalk from 'chalk';
import type { LogEntry, LogLevel } from '../types';
import { Transport, type TransportOptions } from './Transport';
import { safeStringify } from '../utils/serialize';

export class PrettyTransport extends Transport {
  private readonly levelColorMap: Record<Exclude<LogLevel, 'silent'>, any>;

  constructor(options?: TransportOptions) {
    super(options);
    this.levelColorMap = {
      fatal: chalk.bgRed.white.bold,
      error: chalk.red.bold,
      warn: chalk.yellow.bold,
      info: chalk.blue.bold,
      debug: chalk.green,
      trace: chalk.gray,
    };
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
    const { level, message, service, time: _, timestamp: __, ...rest } = logEntry;
    
    const colorizer = this.levelColorMap[level as Exclude<LogLevel, 'silent'>] || chalk.white;
    
    // timestamp can be number (Date.now()) or string (ISO)
    const timeStr = chalk.gray(`[${new Date(timestamp).toISOString()}]`);
    const levelString = colorizer(`[${level.toUpperCase()}]`);
    const serviceString = service ? chalk.cyan(`(${service})`) : '';
    
    let logString = `${timeStr} ${levelString} ${serviceString}: ${message}`;
    
    // Add metadata if present
    const metaKeys = Object.keys(rest);
    if (metaKeys.length > 0) {
      const metaString = chalk.gray(safeStringify(rest));
      logString += `\n${metaString}`;
    }
    
    console.log(logString);
  }
}


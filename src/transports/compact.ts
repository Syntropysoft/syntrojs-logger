/**
 * Compact Transport - Single-line logs optimized for readability
 */

import chalk from 'chalk';
import type { LogEntry, LogLevel } from '../types';
import { Transport, type TransportOptions } from './Transport';
import { safeStringify } from '../utils/serialize';

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

  log(entry: LogEntry): void {
    if (!this.isLevelEnabled(entry.level)) {
      return;
    }

    const { timestamp, level, message, service, ...rest } = entry;
    
    const colorizer = this.levelColorMap[level as Exclude<LogLevel, 'silent'>] || chalk.white;
    
    const time = chalk.gray(new Date(timestamp).toLocaleTimeString());
    const levelString = colorizer(`[${level.toUpperCase()}]`);
    const serviceString = service ? chalk.blue(`(${service})`) : '';
    
    let logString = `${time} ${levelString} ${serviceString}: ${message}`;
    
    // Add metadata on same line
    const metaKeys = Object.keys(rest);
    if (metaKeys.length > 0) {
      const metaString = metaKeys
        .map((key) => {
          const value = rest[key];
          const formattedValue = typeof value === 'object' && value !== null
            ? safeStringify(value)
            : value;
          return `${chalk.dim(key)}=${chalk.gray(formattedValue)}`;
        })
        .join(' ');
      
      logString += ` ${chalk.dim('|')} ${metaString}`;
    }
    
    console.log(logString);
  }
}

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

  private formatTimestamp(ts: string): string {
    const date = new Date(ts);
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const DD = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${YYYY}-${MM}-${DD} ${HH}:${min}:${ss}`;
  }

  log(entry: LogEntry): void {
    if (!this.isLevelEnabled(entry.level)) {
      return;
    }

    const { timestamp, level, service, message, ...rest } = entry;

    const colorizer = this.levelColorMap[level as Exclude<LogLevel, 'silent'>] || chalk.white;

    // Format timestamp
    const timeStr = this.formatTimestamp(timestamp);

    // Format level with fixed width for alignment
    const levelStr = colorizer(level.toUpperCase().padEnd(5));

    // Format service name
    const serviceStr = chalk.magenta(`[${service}]`);

    // Combine metadata and message
    const allMeta: Record<string, unknown> = {
      ...rest,
      message,
    };
    const metaKeys = Object.keys(allMeta);
    let metaStr = '';
    if (metaKeys.length > 0) {
      metaStr = chalk.dim(
        ' [' +
          metaKeys
            .map((key) => `${key}=${JSON.stringify(allMeta[key])}`)
            .join(' ') +
          ']'
      );
    }

    // Assemble final string
    const logString = `${timeStr} ${levelStr} ${serviceStr}${metaStr}`;

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


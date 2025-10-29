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

  log(entry: LogEntry): void {
    if (!this.isLevelEnabled(entry.level)) {
      return;
    }

    const { timestamp, level, message, service, ...rest } = entry;
    
    const colorizer = this.levelColorMap[level as Exclude<LogLevel, 'silent'>] || chalk.white;
    
    const time = chalk.gray(new Date(timestamp).toLocaleTimeString());
    const levelString = colorizer(`[${level.toUpperCase()}]`);
    const serviceString = service ? chalk.cyan(`(${service})`) : '';
    
    let logString = `${time} ${levelString} ${serviceString}: ${message}`;
    
    // Add metadata if present
    const metaKeys = Object.keys(rest);
    if (metaKeys.length > 0) {
      const metaString = chalk.gray(safeStringify(rest));
      logString += `\n${metaString}`;
    }
    
    console.log(logString);
  }
}


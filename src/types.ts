/**
 * Core types for the logger
 */

import type { LogLevel } from './levels';
import type { Transport } from './transports/Transport';

export type { LogLevel } from './levels';
export type { Transport } from './transports/Transport';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service?: string;
  [key: string]: unknown;
}

export interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  transport?: Transport;
}

export type LogFormatArg = string | number | boolean | null | undefined;
export type LogMetadata = Record<string, unknown>;
export type JsonValue = LogFormatArg | LogMetadata | LogMetadata[];


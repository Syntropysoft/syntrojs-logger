/**
 * SyntroJS Logger
 * 
 * A fast, simple, and developer-friendly logger for Node.js and Bun
 */

export { Logger } from './Logger';
export * from './types';
export * from './levels';
export * from './transports';
export * from './LoggerRegistry';
export { AsyncContext } from './context/Context';

// Convenience factory function
import { Logger } from './Logger';
import type { LogLevel } from './levels';
import type { Transport } from './types';
import { PrettyTransport } from './transports/pretty';
import { JsonTransport } from './transports/json';
import { CompactTransport } from './transports/compact';
import { ClassicTransport } from './transports/classic';

export interface CreateLoggerOptions {
  name?: string;
  level?: LogLevel;
  transport?: Transport | 'pretty' | 'json' | 'compact' | 'classic';
}

/**
 * Create a logger instance
 */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const name = options.name || 'app';
  const level = options.level || 'info';
  
  let transport: Transport;
  if (!options.transport || options.transport === 'json') {
    transport = new JsonTransport(); // JSON is now the default - ultrafast!
  } else if (options.transport === 'pretty') {
    transport = new PrettyTransport();
  } else if (options.transport === 'compact') {
    transport = new CompactTransport();
  } else if (options.transport === 'classic') {
    transport = new ClassicTransport();
  } else {
    transport = options.transport;
  }

  return new Logger(name, transport, level);
}

/**
 * Default logger instance
 */
export const logger = createLogger();


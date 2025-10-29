/**
 * SyntroJS Logger
 * 
 * A fast, simple, and developer-friendly logger for Node.js and Bun
 */

export { Logger } from './Logger';
export * from './types';
export type { LogRetentionRules } from './types';
export * from './levels';
export * from './transports';
export * from './LoggerRegistry';
export { AsyncContext } from './context/Context';
export * from './masking';
export * from './sanitization';
export * from './compliance';
export { validatePlainJson, validateAndSanitizeJson } from './utils/jsonValidation';

// Convenience factory function
import { Logger } from './Logger';
import type { LogLevel } from './levels';
import type { Transport } from './types';
import { PrettyTransport } from './transports/pretty';
import { JsonTransport } from './transports/json';
import { CompactTransport } from './transports/compact';
import { ClassicTransport } from './transports/classic';
import type { MaskingEngine } from './masking/MaskingEngine';
import { SanitizationEngine } from './sanitization/SanitizationEngine';
import type { LoggingMatrix } from './compliance/LoggingMatrix';

export interface CreateLoggerOptions {
  name?: string;
  level?: LogLevel;
  transport?: Transport | 'pretty' | 'json' | 'compact' | 'classic';
  maskingEngine?: MaskingEngine;
  sanitizationEngine?: SanitizationEngine;
  useAsyncContext?: boolean;
  loggingMatrix?: LoggingMatrix;
}

/**
 * Create a logger instance
 */
// Transport factory map - declarative and easy to extend
const TRANSPORT_MAP: Record<string, () => Transport> = {
  json: () => new JsonTransport(),
  pretty: () => new PrettyTransport(),
  compact: () => new CompactTransport(),
  classic: () => new ClassicTransport(),
} as const;

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  // Functional approach: Defaults using nullish coalescing
  const name = options.name ?? 'app';
  const level = options.level ?? 'info';

  // Resolve transport: use map for strings, direct assignment for Transport instances
  const transportOption = options.transport ?? 'json';
  const transport: Transport = typeof transportOption === 'string'
    ? (TRANSPORT_MAP[transportOption] ?? TRANSPORT_MAP.json)()
    : transportOption;

  // Functional approach: Create SanitizationEngine conditionally using ternary
  const sanitizationEngine = options.sanitizationEngine ?? 
    (options.maskingEngine ? new SanitizationEngine(options.maskingEngine) : undefined);

  return new Logger(name, transport, level, {}, {
    sanitizationEngine,
    useAsyncContext: options.useAsyncContext,
    loggingMatrix: options.loggingMatrix
  });
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Core types for the logger
 */

import type { LogLevel } from './levels';
import type { Transport } from './transports/Transport';

export type { LogLevel } from './levels';
export type { Transport } from './transports/Transport';

export interface LogEntry {
  /**
   * Timestamp as number (Date.now()) for consistency and performance.
   * Transports format this to ISO string when needed for human-readable output.
   * This avoids unnecessary Date object creation and string conversions in the hot path.
   */
  timestamp: number;
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

/**
 * Type for metadata that can be attached to loggers.
 * 
 * **Completely flexible:** Can be any JSON object (nested at any depth) with any keys and any JSON-compatible values.
 * Supports nested objects, arrays, and any combination thereof. No flattening required.
 * 
 * Use this for ANY metadata your organization needs:
 * - Compliance rules (retention, policies, regulations)
 * - Business metadata (campaign info, user segments, product IDs)
 * - Internal process data (workflow IDs, pipeline stages, job queues)
 * - Audit information (who, what, when, why)
 * - Any other contextual information useful for log analysis
 * 
 * The logger simply includes this metadata in all logs from the logger instance.
 * No validation, no interpretation - just passes it through as-is, preserving the full structure.
 * 
 * @example
 * ```typescript
 * // Simple flat metadata
 * const complianceMetadata: LogRetentionRules = {
 *   policy: 'HIPAA-compliant-7years',
 *   retentionPeriod: '7-years',
 *   encryption: 'AES-256'
 * };
 * 
 * // Nested objects (multiple levels)
 * const nestedMetadata: LogRetentionRules = {
 *   compliance: {
 *     policy: 'GDPR-COMPLIANT',
 *     retention: {
 *       period: '90-days',
 *       archive: {
 *         enabled: true,
 *         location: 's3://archive'
 *       }
 *     },
 *     encryption: {
 *       algorithm: 'AES-256',
 *       keyRotation: '30-days'
 *     }
 *   },
 *   business: {
 *     campaign: {
 *       id: 'summer-2024',
 *       channels: ['email', 'social'],
 *       target: {
 *         audience: 'millennials',
 *         demographics: { age: [25, 40], location: 'US' }
 *       }
 *     }
 *   },
 *   internal: {
 *     workflow: {
 *       id: 'wf-123',
 *       pipeline: 'etl',
 *       stages: {
 *         extraction: { source: 'db', format: 'parquet' },
 *         transformation: { rules: ['clean', 'validate'] },
 *         load: { destination: 'warehouse' }
 *       }
 *     }
 *   }
 * };
 * 
 * // Arrays of objects
 * const arrayMetadata: LogRetentionRules = {
 *   policies: [
 *     { name: 'GDPR', version: '2024.1' },
 *     { name: 'CCPA', version: '2023.2' }
 *   ],
 *   campaigns: [
 *     { id: 'camp-1', active: true },
 *     { id: 'camp-2', active: false }
 *   ]
 * };
 * ```
 */
export type LogRetentionRules = Record<string, JsonValue>;

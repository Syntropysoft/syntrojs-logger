/**
 * @file src/compliance/LoggingMatrix.ts
 * @description Controls which context fields are included in logs by level.
 * 
 * This prevents logging sensitive fields like api_key, authorization headers, etc.
 * Only explicitly allowed fields are included, ensuring compliance and security.
 */

import type { LogLevel } from '../levels';

/**
 * @type LoggingMatrix
 * @description Matrix defining which context fields to include per log level.
 * 
 * Example:
 * ```typescript
 * {
 *   default: ['correlationId', 'transactionId'],
 *   info: ['correlationId', 'transactionId', 'userId'],
 *   error: ['*'] // Include all fields
 * }
 * ```
 * 
 * Use `['*']` to include all fields for a specific level.
 * If a level is not specified, `default` is used.
 */
export type LoggingMatrix = Partial<Record<LogLevel | 'default', string[]>>;

/**
 * @class FieldFilter
 * @description Filters context fields based on logging matrix configuration.
 */
export class FieldFilter {
  private matrix: LoggingMatrix; // Mutable for hot reconfiguration

  constructor(matrix?: LoggingMatrix) {
    this.matrix = matrix ?? {};
  }

  /**
   * Filters context fields based on the logging matrix for the given level.
   * Uses guard clauses and functional programming for better maintainability.
   * 
   * @param context - The full context object
   * @param level - The log level
   * @returns Filtered context with only allowed fields (immutable)
   */
  public filterContext(context: Record<string, unknown>, level: LogLevel): Record<string, unknown> {
    // Guard clause: No matrix configured - return all fields (backward compatible)
    // Optimization: Direct length check (matrix is always an object if not undefined)
    if (!this.matrix || Object.keys(this.matrix).length === 0) {
      return context;
    }

    const fieldsToKeep = this.matrix[level] || this.matrix.default;
    
    // Guard clause: No fields specified - return empty (most secure)
    if (!fieldsToKeep || fieldsToKeep.length === 0) {
      return {};
    }

    // Guard clause: Wildcard - include all fields
    if (fieldsToKeep.includes('*')) {
      return context;
    }

    // Functional approach: Filter to only allowed fields (immutable)
    // Performance: Create Set once for O(1) lookups
    const allowedSet = new Set(fieldsToKeep.map(field => field.toLowerCase()));

    // Functional composition: filter + reduce in single pipeline
    return Object.keys(context)
      .filter(key => 
        Object.prototype.hasOwnProperty.call(context, key) && 
        allowedSet.has(key.toLowerCase())
      )
      .reduce<Record<string, unknown>>((filtered, key) => {
        // Preserve original case (find is O(n) but only for case matching)
        filtered[key] = context[key];
        return filtered;
      }, {});
  }

  /**
   * Updates the logging matrix (hot reconfiguration).
   * Functional approach: Merge matrices immutably.
   * 
   * @param newMatrix - The new logging matrix configuration
   */
  public reconfigure(newMatrix: LoggingMatrix): void {
    // Functional approach: Spread operator for immutable merge
    this.matrix = { ...this.matrix, ...newMatrix };
  }

  /**
   * Gets the current logging matrix configuration.
   * @returns The current logging matrix
   */
  public getMatrix(): LoggingMatrix {
    return { ...this.matrix };
  }
}


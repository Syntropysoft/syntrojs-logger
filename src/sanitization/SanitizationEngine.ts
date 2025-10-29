/**
 * @file src/sanitization/SanitizationEngine.ts
 * @description Final security layer that sanitizes log entries before they are written by a transport.
 */

import type { MaskingEngine } from '../masking/MaskingEngine';

/**
 * @class SanitizationEngine
 * A security engine that makes log entries safe for printing by stripping
 * potentially malicious control characters, such as ANSI escape codes.
 * This prevents log injection attacks that could exploit terminal vulnerabilities.
 */
export class SanitizationEngine {
  private readonly maskingEngine?: MaskingEngine;
  /** @private This regex matches ANSI escape codes used for colors, cursor movement, etc. */
  private readonly ansiRegex =
    /[\x1b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|[\x1b\u009b]/g;

  /**
   * @constructor
   * @param maskingEngine - Optional masking engine for data obfuscation
   */
  constructor(maskingEngine?: MaskingEngine) {
    this.maskingEngine = maskingEngine;
  }

  /**
   * Processes a log metadata object, sanitizing all its string values.
   * @param meta - The metadata object to sanitize.
   * @returns A new, sanitized metadata object.
   */
  public process(meta: Record<string, unknown>): Record<string, unknown> {
    let sanitized = this.sanitizeRecursively(meta);
    if (this.maskingEngine) {
      // Ensure sanitized is a Record before passing to masking engine
      const sanitizedRecord =
        typeof sanitized === 'object' && sanitized !== null && !Array.isArray(sanitized)
          ? (sanitized as Record<string, unknown>)
          : meta;
      sanitized = this.maskingEngine.process(sanitizedRecord);
    }
    // Ensure return type is Record
    return typeof sanitized === 'object' && sanitized !== null && !Array.isArray(sanitized)
      ? (sanitized as Record<string, unknown>)
      : meta;
  }

  /**
   * @private
   * Recursively traverses an object or array to sanitize all string values.
   * IMPORTANT: Only processes plain objects (data.constructor === Object) to avoid
   * corrupting class instances, which protects logging and tracing tools.
   *
   * Uses guard clauses and functional programming for better maintainability.
   * @param data - The data to process.
   * @returns The sanitized data.
   */
  private sanitizeRecursively(data: unknown): unknown {
    // Guard clause: String - sanitize and return
    if (typeof data === 'string') {
      return data.replace(this.ansiRegex, '');
    }

    // Guard clause: Array - use functional map
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeRecursively(item));
    }

    // Guard clause: Plain object - process recursively
    const isPlainObject = typeof data === 'object' && data !== null && data.constructor === Object;

    if (isPlainObject) {
      // Functional approach: use Object.keys + reduce for immutability
      return Object.keys(data)
        .filter((key) => Object.prototype.hasOwnProperty.call(data, key))
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = this.sanitizeRecursively((data as Record<string, unknown>)[key]);
          return acc;
        }, {});
    }

    // Guard clause: Any other type - return as-is (immutable)
    return data;
  }
}

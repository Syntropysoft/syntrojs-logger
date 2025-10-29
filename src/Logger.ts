/**
 * Core Logger implementation
 *
 * Provides a fast, simple logging API inspired by Pino but even more lightweight
 */

import * as util from 'node:util';
import { FieldFilter } from './compliance/LoggingMatrix';
import type { LoggingMatrix } from './compliance/LoggingMatrix';
import { AsyncContext } from './context/Context';
import type { LogLevel } from './levels';
import { isLevelEnabled } from './levels';
import type { MaskingEngine } from './masking/MaskingEngine';
import type { MaskingRule } from './masking/MaskingEngine';
import { MaskingEngine as MaskingEngineClass } from './masking/MaskingEngine';
import type { SanitizationEngine } from './sanitization/SanitizationEngine';
import { SanitizationEngine as SanitizationEngineClass } from './sanitization/SanitizationEngine';
import type { Transport } from './transports/Transport';
import { JsonTransport } from './transports/json';
import type { JsonValue, LogFormatArg, LogMetadata } from './types';
import type { LogRetentionRules } from './types';

export interface LoggerBindings {
  [key: string]: unknown;
}

/**
 * Core Logger class
 */
export class Logger {
  public level: LogLevel;
  public name: string;
  private transport: Transport;
  private bindings: LoggerBindings;
  private serviceName: string; // Cache service name for faster access
  private useAsyncContext = true;
  private sanitizationEngine?: SanitizationEngine;
  private maskingEngine?: MaskingEngine;
  private fieldFilter?: FieldFilter;

  /**
   * Disable async context lookup for this logger instance for max performance.
   * Useful for high-performance scenarios where you don't need correlation IDs.
   * @returns {this} The logger instance for chaining.
   */
  withoutContext(): this {
    this.useAsyncContext = false;
    return this;
  }

  constructor(
    name: string,
    transport: Transport = new JsonTransport(), // JSON is the default - ultrafast!
    level: LogLevel = 'info',
    bindings: LoggerBindings = {},
    options?: {
      sanitizationEngine?: SanitizationEngine;
      maskingEngine?: MaskingEngine;
      useAsyncContext?: boolean;
      loggingMatrix?: LoggingMatrix;
    }
  ) {
    this.name = name;
    this.serviceName = name; // Cache for faster property access
    this.transport = transport;
    this.level = level;
    this.bindings = bindings;

    // Assign optional engines (guard clauses for clarity)
    this.sanitizationEngine = options?.sanitizationEngine;
    this.maskingEngine = options?.maskingEngine;

    // Guard clause: Set async context flag if provided
    if (options?.useAsyncContext !== undefined) {
      this.useAsyncContext = options.useAsyncContext;
    }

    // Guard clause: Create field filter if logging matrix provided
    if (options?.loggingMatrix) {
      this.fieldFilter = new FieldFilter(options.loggingMatrix);
    }
  }

  /**
   * Internal logging method.
   * Uses guard clauses and functional parsing for better maintainability.
   */
  private log(level: LogLevel, ...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    // Guard clause: Level not enabled - early return
    if (!isLevelEnabled(level, this.level)) {
      return;
    }

    // Guard clause: No arguments - use defaults
    if (args.length === 0) {
      this.writeLogEntry(level, '', {}, false, undefined);
      return;
    }

    // Parse arguments following Pino-like signature (functional approach)
    const { message, metadata } = this.parseLogArguments(args);

    // Get async context (conditional check for performance)
    const { store, hasContext } = this.getAsyncContext();

    // Write log entry (Single Responsibility: delegates to specialized method)
    this.writeLogEntry(level, message, metadata, hasContext, store);
  }

  /**
   * Parse log arguments following Pino-like signature.
   * Functional approach: returns parsed message and metadata.
   * Single Responsibility: Only parses arguments.
   *
   * @private
   */
  private parseLogArguments(args: (LogFormatArg | LogMetadata | JsonValue)[]): {
    message: string;
    metadata: LogMetadata;
  } {
    const firstArg = args[0];

    // Guard clause: First arg is metadata object
    const isMetadataObject =
      typeof firstArg === 'object' && firstArg !== null && !Array.isArray(firstArg);

    if (isMetadataObject) {
      // Pattern: logger.info({ userId: 123 }, 'User logged in', ...formatArgs)
      const metadata = firstArg as LogMetadata;
      const messageArg = String(args[1] ?? '');
      const formatArgs = args.slice(2);
      const message = this.formatMessage(messageArg, formatArgs);

      return { message, metadata };
    }

    // Pattern: logger.info('User logged in', ...formatArgs)
    const messageArg = String(firstArg ?? '');
    const formatArgs = args.slice(1);
    const message = this.formatMessage(messageArg, formatArgs);

    return { message, metadata: {} };
  }

  /**
   * Format message with optional format arguments (Single Responsibility).
   * Functional approach: Pure function for message formatting.
   * @private
   */
  private formatMessage(
    messageArg: string,
    formatArgs: (LogFormatArg | LogMetadata | JsonValue)[]
  ): string {
    // Guard clause: No format arguments or empty message
    if (!messageArg || formatArgs.length === 0) {
      return messageArg;
    }

    // Functional: Format message with util.format
    return util.format(messageArg, ...formatArgs);
  }

  /**
   * Get async context if enabled (Single Responsibility).
   * @private
   */
  private getAsyncContext(): {
    store: Map<string, unknown> | undefined;
    hasContext: boolean;
  } {
    // Guard clause: Async context disabled
    if (!this.useAsyncContext) {
      return { store: undefined, hasContext: false };
    }

    const store = AsyncContext.storage.getStore();
    const hasContext = !!store && store.size > 0;

    return { store, hasContext };
  }

  /**
   * Write log entry with all processing (Single Responsibility).
   * Handles fast path, compliance pipeline, and JSON construction.
   *
   * @private
   */
  private writeLogEntry(
    level: LogLevel,
    message: string,
    metadata: LogMetadata,
    hasContext: boolean,
    store: Map<string, unknown> | undefined
  ): void {
    // Guard clause: Check if we have any additional data to add (optimized checks)
    const hasBindings = this.hasNonEmptyObject(this.bindings);
    const hasMetadata = this.hasNonEmptyObject(metadata);

    // Fast path: No context, no bindings, no metadata - just core fields
    if (!hasContext && !hasBindings && !hasMetadata) {
      this.writeFastPathLog(level, message);
      return;
    }

    // Build JSON string (Pino-style: minimal object creation)
    const timestamp = Date.now();
    let json = this.buildBaseJson(timestamp, level, message);

    // Compliance Pipeline: Process metadata, context, and bindings
    const shouldProcessCompliance = this.useAsyncContext && this.sanitizationEngine;

    if (!shouldProcessCompliance) {
      // Fast path without compliance
      json = this.appendFieldsToJson(
        json,
        { metadata, bindings: this.bindings },
        hasContext,
        store
      );
      json += '}';
      this.writeToTransport(json);
      return;
    }

    // Process through compliance pipeline (sanitization + masking)
    const processed = this.processCompliancePipeline(metadata, hasContext, store, level);

    // Build final JSON with processed data
    json = this.appendFieldsToJson(
      json,
      {
        metadata: processed.processedMetadata,
        context: processed.processedContext,
        bindings: processed.processedBindings,
      },
      hasContext,
      store
    );
    json += '}';

    this.writeToTransport(json);
  }

  /**
   * Write fast path log (no context, bindings, or metadata).
   * Single Responsibility: Only handles minimal log entry.
   *
   * @private
   */
  private writeFastPathLog(level: LogLevel, message: string): void {
    const timestamp = Date.now();
    const json = `{"timestamp":${timestamp},"level":"${level}","message":${JSON.stringify(message)},"service":"${this.serviceName}"}`;
    this.writeToTransport(json);
  }

  /**
   * Build base JSON string with required fields.
   * Single Responsibility: Only constructs base JSON.
   *
   * @private
   */
  private buildBaseJson(timestamp: number, level: LogLevel, message: string): string {
    const levelStr = `"${level}"`;
    const msgStr = JSON.stringify(message);
    const serviceStr = `"${this.serviceName}"`;
    return `{"timestamp":${timestamp},"level":${levelStr},"message":${msgStr},"service":${serviceStr}`;
  }

  /**
   * Check if object has any enumerable properties (performance helper).
   * Single Responsibility: Only checks object emptiness.
   * @private
   */
  private hasNonEmptyObject(obj: unknown): boolean {
    // Guard clause: Not an object or null/undefined
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    // Performance: Direct length check (Object.keys is optimized in modern JS engines)
    return Object.keys(obj).length > 0;
  }

  /**
   * Process data through compliance pipeline (filter → sanitize → mask).
   * Single Responsibility: Only handles compliance processing logic.
   *
   * @private
   */
  private processCompliancePipeline(
    metadata: LogMetadata,
    hasContext: boolean,
    store: Map<string, unknown> | undefined,
    level: LogLevel
  ): {
    processedMetadata: LogMetadata;
    processedContext: Map<string, unknown> | undefined;
    processedBindings: LoggerBindings;
  } {
    // Guard clause: No sanitization engine
    if (!this.sanitizationEngine) {
      return {
        processedMetadata: metadata,
        processedContext: hasContext ? store : undefined,
        processedBindings: this.bindings,
      };
    }

    // Collect all data sources (functional approach)
    // Optimization: Direct Map iteration is faster than Array.from for small maps
    const contextData =
      hasContext && store
        ? Object.fromEntries(
            Array.from(store.entries()).filter(([, value]) => value !== undefined) // Key is always defined from Map entries
          )
        : {};

    const filteredContext =
      this.fieldFilter && hasContext
        ? this.fieldFilter.filterContext(contextData, level)
        : contextData;

    // Combine all data sources (metadata takes precedence)
    const combinedData = {
      ...this.collectValidBindings(),
      ...filteredContext,
      ...metadata,
    };

    // Process through compliance pipeline
    const sanitized = this.sanitizationEngine.process(combinedData);

    // Rebuild context and bindings from sanitized data (immutable approach)
    const processedContext = this.rebuildContextFromSanitized(sanitized, hasContext, store);

    const processedBindings = this.rebuildBindingsFromSanitized(sanitized, hasContext, store);

    return {
      processedMetadata: sanitized,
      processedContext,
      processedBindings,
    };
  }

  /**
   * Collect valid bindings (functional approach).
   * Optimized: Key check is redundant (Object.keys never returns empty strings).
   * @private
   */
  private collectValidBindings(): LoggerBindings {
    // Guard clause: No bindings
    if (!this.bindings) {
      return {};
    }

    // Functional approach: Filter undefined values only (keys are always truthy)
    return Object.keys(this.bindings)
      .filter((key) => this.bindings[key] !== undefined)
      .reduce<LoggerBindings>((acc, key) => {
        acc[key] = this.bindings[key];
        return acc;
      }, {});
  }

  /**
   * Rebuild context map from sanitized data (functional + immutable).
   * @private
   */
  private rebuildContextFromSanitized(
    sanitized: Record<string, unknown>,
    hasContext: boolean,
    store: Map<string, unknown> | undefined
  ): Map<string, unknown> | undefined {
    // Guard clause: No context to rebuild
    if (!hasContext || !store || !this.useAsyncContext) return undefined;

    return new Map(
      Object.keys(sanitized)
        .filter((key) => {
          const wasInContext = store.has(key);
          const wasInBindings =
            (this.bindings && Object.prototype.hasOwnProperty.call(this.bindings, key)) ?? false;
          return wasInContext && !wasInBindings;
        })
        .map((key) => [key, sanitized[key]])
    );
  }

  /**
   * Rebuild bindings from sanitized data (functional + immutable).
   * @private
   */
  private rebuildBindingsFromSanitized(
    sanitized: Record<string, unknown>,
    hasContext: boolean,
    store: Map<string, unknown> | undefined
  ): LoggerBindings {
    // Guard clause: No bindings to rebuild
    if (!this.bindings) return {};

    return Object.keys(sanitized)
      .filter((key) => {
        const wasInBindings = Object.prototype.hasOwnProperty.call(this.bindings, key);
        const wasInContext = hasContext && store?.has(key);
        return wasInBindings && !wasInContext;
      })
      .reduce<LoggerBindings>((acc, key) => {
        acc[key] = sanitized[key];
        return acc;
      }, {});
  }

  /**
   * Append fields to JSON string (Single Responsibility).
   * Returns new string (immutable approach).
   * @private
   */
  private appendFieldsToJson(
    json: string,
    data: {
      metadata: LogMetadata;
      context?: Map<string, unknown>;
      bindings?: LoggerBindings;
    },
    hasContext: boolean,
    store: Map<string, unknown> | undefined
  ): string {
    let result = json;

    // Append context fields (functional approach)
    if (hasContext && (data.context || store)) {
      const contextToUse = data.context || (store ?? new Map());
      result += Array.from(contextToUse.entries())
        .filter(([key, value]) => key && value !== undefined)
        .map(([key, value]) => `,"${key}":${JSON.stringify(value)}`)
        .join('');
    }

    // Append bindings (skip duplicates with context) - functional approach
    if (data.bindings) {
      result += Object.keys(data.bindings)
        .filter((key) => key && data.bindings?.[key] !== undefined)
        .filter((key) => !hasContext || !store?.has(key))
        .map((key) => `,"${key}":${JSON.stringify(data.bindings?.[key])}`)
        .join('');
    }

    // Append metadata (takes precedence, skip duplicates) - functional approach
    if (data.metadata) {
      result += Object.keys(data.metadata)
        .filter((key) => key && data.metadata[key] !== undefined)
        .filter((key) => {
          const notInContext = !hasContext || !store?.has(key);
          const notInBindings =
            !data.bindings || !Object.prototype.hasOwnProperty.call(data.bindings, key);
          return notInContext && notInBindings;
        })
        .map((key) => `,"${key}":${JSON.stringify(data.metadata[key])}`)
        .join('');
    }

    return result;
  }

  /**
   * Write to transport with error handling (Single Responsibility).
   * @private
   */
  private writeToTransport(json: string): void {
    try {
      this.transport.log(json);
    } catch (error) {
      // Silent Observer: Never interrupt the app
      console.error('[Logger Error] Failed to write log:', error);
    }
  }

  // Public logging methods
  fatal(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('fatal', ...args);
  }

  error(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('error', ...args);
  }

  warn(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('warn', ...args);
  }

  info(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('info', ...args);
  }

  debug(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('debug', ...args);
  }

  trace(...args: (LogFormatArg | LogMetadata | JsonValue)[]): void {
    this.log('trace', ...args);
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Create a child logger with additional bindings
   */
  child(bindings: LoggerBindings): Logger {
    return new Logger(
      this.name,
      this.transport,
      this.level,
      { ...this.bindings, ...bindings },
      {
        sanitizationEngine: this.sanitizationEngine,
        maskingEngine: this.maskingEngine,
        useAsyncContext: this.useAsyncContext,
        loggingMatrix: this.fieldFilter ? this.fieldFilter.getMatrix() : undefined,
      }
    );
  }

  /**
   * Create a logger with a specific source.
   * Useful for identifying which module or component generated the log.
   * @param source - The name of the source (e.g., 'redis', 'AuthModule').
   * @returns A new logger instance with the `source` binding.
   */
  withSource(source: string): Logger {
    return this.child({ source });
  }

  /**
   * Create a logger with a transaction ID bound to it.
   * Useful for tracking a request across multiple services in distributed systems.
   * @param transactionId - The unique ID of the transaction.
   * @returns A new logger instance with the `transactionId` binding.
   */
  withTransactionId(transactionId: string): Logger {
    return this.child({ transactionId });
  }

  /**
   * Create a logger with metadata bound to it.
   * The provided metadata will be included in all logs from this logger.
   *
   * **Supports nested JSON of any depth** - objects, arrays, nested objects, etc.
   *
   * Use this for any metadata your organization needs:
   * - Compliance rules (retention, policies, regulations)
   * - Business metadata (campaign info, user segments, product IDs)
   * - Internal process data (workflow IDs, pipeline stages, job queues)
   * - Audit information or any other contextual data
   *
   * The logger simply includes this metadata as-is, preserving the full nested structure,
   * without validation or interpretation.
   * @param rules - A JSON object (can be nested at any depth) containing any metadata you need.
   * @returns A new logger instance with the `retention` binding (field name for backward compatibility).
   */
  withRetention(rules: LogRetentionRules): Logger {
    return this.child({ retention: rules });
  }

  /**
   * Flush buffered logs to transport.
   * Useful for graceful shutdown.
   * Uses guard clause pattern for optional method support.
   */
  async flush(): Promise<void> {
    // Guard clause: Transport doesn't support flush
    if (!this.transport.flush) {
      return;
    }

    await this.transport.flush();
  }

  /**
   * Close transport and cleanup resources.
   * Uses guard clause pattern for optional method support.
   */
  async close(): Promise<void> {
    // Guard clause: Transport doesn't support close
    if (!this.transport.close) {
      return;
    }

    await this.transport.close();
  }

  /**
   * Reconfigure logger settings at runtime (hot reconfiguration).
   *
   * Allows changing logger settings without creating a new instance.
   * Security: Only allows adding masking rules, not modifying existing ones.
   *
   * @param options - Configuration options
   * @param options.level - Change log level dynamically
   * @param options.transport - Change transport dynamically
   * @param options.addMaskingRule - Add a new masking rule (only add, cannot modify existing)
   * @param options.loggingMatrix - Update logging matrix configuration
   *
   * @example
   * ```typescript
   * // Change log level at runtime
   * logger.reconfigure({ level: 'debug' });
   *
   * // Switch transport
   * logger.reconfigure({ transport: new PrettyTransport() });
   *
   * // Add a new masking rule
   * logger.reconfigure({
   *   addMaskingRule: {
   *     pattern: /custom-field/i,
   *     strategy: MaskingStrategy.CUSTOM,
   *     customMask: (value) => '***'
   *   }
   * });
   *
   * // Update logging matrix
   * logger.reconfigure({
   *   loggingMatrix: {
   *     default: ['correlationId'],
   *     info: ['correlationId', 'userId']
   *   }
   * });
   * ```
   */
  reconfigure(options: {
    level?: LogLevel;
    transport?: Transport;
    addMaskingRule?: MaskingRule;
    loggingMatrix?: LoggingMatrix;
  }): void {
    // Guard clause: No options provided (optimized check)
    if (!options || !this.hasNonEmptyObject(options)) {
      return;
    }

    // Change log level (guard clause pattern)
    if (options.level !== undefined) {
      this.level = options.level;
    }

    // Change transport (with cleanup) - guard clause pattern
    if (options.transport !== undefined) {
      this.switchTransport(options.transport);
    }

    // Add new masking rule (only add, cannot modify existing rules) - guard clause
    if (options.addMaskingRule !== undefined) {
      this.addMaskingRuleSafely(options.addMaskingRule);
    }

    // Update logging matrix - guard clause
    if (options.loggingMatrix !== undefined) {
      this.updateLoggingMatrix(options.loggingMatrix);
    }
  }

  /**
   * Switch transport with cleanup (Single Responsibility).
   * Fire-and-forget cleanup pattern (non-blocking).
   * @private
   */
  private switchTransport(newTransport: Transport): void {
    const oldTransport = this.transport;

    // Immediately switch to new transport (non-blocking)
    this.transport = newTransport;

    // Guard clause: No cleanup needed
    if (!oldTransport.close) {
      return;
    }

    // Fire and forget cleanup (don't block hot reconfiguration)
    Promise.resolve(oldTransport.close()).catch(() => {
      // Silent observer: Ignore cleanup errors
    });
  }

  /**
   * Add masking rule safely (Single Responsibility).
   * Security: Only allows adding rules, not modifying existing ones.
   * @private
   */
  private addMaskingRuleSafely(rule: MaskingRule): void {
    // Guard clause: Use existing masking engine if available
    if (this.maskingEngine) {
      this.maskingEngine.addRule(rule);
      return;
    }

    // Create MaskingEngine if it doesn't exist (dependency injection)
    this.maskingEngine = new MaskingEngineClass({ enableDefaultRules: false });
    this.maskingEngine.addRule(rule);

    // Guard clause: Create SanitizationEngine if it doesn't exist
    if (!this.sanitizationEngine) {
      this.sanitizationEngine = new SanitizationEngineClass(this.maskingEngine);
    }
  }

  /**
   * Update logging matrix (Single Responsibility).
   * @private
   */
  private updateLoggingMatrix(matrix: LoggingMatrix): void {
    // Guard clause: Update existing field filter
    if (this.fieldFilter) {
      this.fieldFilter.reconfigure(matrix);
      return;
    }

    // Create new field filter
    this.fieldFilter = new FieldFilter(matrix);
  }
}

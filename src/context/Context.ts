/**
 * Async Context Manager for Correlation IDs
 *
 * Uses AsyncLocalStorage to propagate correlation IDs and other context
 * automatically through async operations.
 *
 * Inspired by:
 * - Elysia's `state` for request-scoped data
 * - Fastify's `@fastify/request-context` for context propagation
 * - FastAPI's `request.state` for correlation IDs
 * - syntropyLog's ContextManager for enterprise features
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

type ContextData = Map<string, unknown>;

export interface AsyncContextConfig {
  /**
   * Name of the correlation ID header
   * Default: 'correlationId'
   * Examples: 'x-correlation-id', 'x-request-id', 'trace-id'
   */
  correlationIdKey?: string;

  /**
   * Whether to auto-generate correlation ID if not present
   * Default: true
   */
  autoGenerate?: boolean;
}

/**
 * Simple context manager for correlation IDs and request-scoped data
 *
 * Similar to:
 * - Elysia's `state` for request-scoped data
 * - Fastify's `@fastify/request-context` for context propagation
 * - FastAPI's `request.state` for middleware data
 * - syntropyLog's ContextManager for correlation IDs
 */
export class AsyncContext {
  private static storage = new AsyncLocalStorage<ContextData>();
  private static config: AsyncContextConfig = {
    correlationIdKey: 'correlationId',
    autoGenerate: true,
  };
  private static correlationIdKey = 'correlationId'; // Cache for fast access

  /**
   * Configure the context manager
   */
  static configure(config: AsyncContextConfig): void {
    AsyncContext.config = { ...AsyncContext.config, ...config };
    if (config.correlationIdKey) {
      AsyncContext.correlationIdKey = config.correlationIdKey;
    }
  }

  /**
   * Run a function within a context with optional initial data.
   *
   * @param fn - Function to run within the context
   * @param initialData - Optional initial context data (e.g., correlationId, userId, request metadata)
   *
   * @example
   * ```typescript
   * // Without initial data (auto-generates correlationId if enabled)
   * AsyncContext.run(() => {
   *   const id = AsyncContext.getCorrelationId(); // UUID generated automatically
   * });
   *
   * // With initial data (useful for middlewares)
   * AsyncContext.run(() => {
   *   logger.info('Processing request');
   * }, { correlationId: 'req-123', userId: 456, ip: '192.168.1.1' });
   * ```
   */
  /**
   * Run a function within a context with optional initial data.
   * Functional approach: Single expression using ternary.
   *
   * @param fn - Function to run within the context
   * @param initialData - Optional initial context data (e.g., correlationId, userId, request metadata)
   *
   * @example
   * ```typescript
   * // Without initial data (auto-generates correlationId if enabled)
   * AsyncContext.run(() => {
   *   const id = AsyncContext.getCorrelationId(); // UUID generated automatically
   * });
   *
   * // With initial data (useful for middlewares)
   * AsyncContext.run(() => {
   *   logger.info('Processing request');
   * }, { correlationId: 'req-123', userId: 456, ip: '192.168.1.1' });
   * ```
   */
  static run<R>(fn: () => R, initialData?: Record<string, unknown>): R {
    // Functional approach: Ternary for conditional map creation
    const contextMap = initialData
      ? new Map(Object.entries(initialData))
      : new Map<string, unknown>();
    return AsyncContext.storage.run(contextMap, fn);
  }

  /**
   * Run async function within a context with optional initial data.
   * Functional approach: Single expression using ternary.
   *
   * @param fn - Async function to run within the context
   * @param initialData - Optional initial context data (e.g., correlationId, userId, request metadata)
   *
   * @example
   * ```typescript
   * // With initial data from HTTP request middleware
   * await AsyncContext.runAsync(async () => {
   *   const correlationId = AsyncContext.getCorrelationId(); // from initialData or auto-generated
   *   await processRequest();
   * }, {
   *   correlationId: req.headers['x-correlation-id'],
   *   userId: req.user?.id,
   *   ip: req.ip
   * });
   * ```
   */
  static async runAsync<R>(
    fn: () => Promise<R>,
    initialData?: Record<string, unknown>
  ): Promise<R> {
    // Functional approach: Ternary for conditional map creation
    const contextMap = initialData
      ? new Map(Object.entries(initialData))
      : new Map<string, unknown>();
    return AsyncContext.storage.run(contextMap, fn);
  }

  /**
   * Get a value from current context
   */
  static get(key: string): unknown | undefined {
    return AsyncContext.storage.getStore()?.get(key);
  }

  /**
   * Get all context data
   */
  static getAll(): Record<string, unknown> {
    const store = AsyncContext.storage.getStore();
    if (!store) return {};
    return Object.fromEntries(store.entries());
  }

  /**
   * Set a value in the current context
   */
  static set(key: string, value: unknown): void {
    AsyncContext.storage.getStore()?.set(key, value);
  }

  /**
   * Get correlation ID from context.
   * Auto-generates one if not present and autoGenerate is enabled.
   * Uses guard clauses for better readability.
   */
  static getCorrelationId(): string {
    const store = AsyncContext.storage.getStore();

    // Guard clause: No context store available
    if (!store) {
      return '';
    }

    let correlationId = store.get(AsyncContext.correlationIdKey) as string | undefined;

    // Guard clause: Auto-generate if not present and enabled
    if (!correlationId && AsyncContext.config.autoGenerate) {
      correlationId = randomUUID();
      store.set(AsyncContext.correlationIdKey, correlationId);
    }

    return correlationId || '';
  }

  /**
   * Set correlation ID in context
   */
  static setCorrelationId(correlationId: string): void {
    AsyncContext.set(AsyncContext.correlationIdKey, correlationId);
  }

  /**
   * Clear all context data
   * Useful for cleanup or testing
   */
  static clear(): void {
    AsyncContext.storage.getStore()?.clear();
  }

  /**
   * Check if we're currently in a context
   */
  static isActive(): boolean {
    return AsyncContext.storage.getStore() !== undefined;
  }

  /**
   * Get the current context store (Map instance)
   * @internal Used by Logger for efficient context iteration
   */
  static getStore(): Map<string, unknown> | undefined {
    return AsyncContext.storage.getStore();
  }
}

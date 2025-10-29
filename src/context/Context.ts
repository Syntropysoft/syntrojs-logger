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
    this.config = { ...this.config, ...config };
    if (config.correlationIdKey) {
      this.correlationIdKey = config.correlationIdKey;
    }
  }

  /**
   * Run a function within a context
   */
  static run<R>(fn: () => R): R {
    return this.storage.run(new Map(), fn);
  }

  /**
   * Run async function within a context
   */
  static async runAsync<R>(fn: () => Promise<R>): Promise<R> {
    return this.storage.run(new Map(), fn);
  }

  /**
   * Get a value from current context
   */
  static get(key: string): unknown | undefined {
    return this.storage.getStore()?.get(key);
  }

  /**
   * Get all context data
   */
  static getAll(): Record<string, unknown> {
    const store = this.storage.getStore();
    if (!store) return {};
    return Object.fromEntries(store.entries());
  }

  /**
   * Set a value in the current context
   */
  static set(key: string, value: unknown): void {
    this.storage.getStore()?.set(key, value);
  }

  /**
   * Get correlation ID from context
   * Auto-generates one if not present and autoGenerate is enabled
   */
  static getCorrelationId(): string {
    const store = this.storage.getStore();
    if (!store) return '';
    
    let correlationId = store.get(this.correlationIdKey) as string | undefined;
    
    // Auto-generate if not present and auto-generate is enabled
    // Fast path: Check correlationId first to avoid autoGenerate check if not needed
    if (!correlationId && this.config.autoGenerate) {
      correlationId = randomUUID();
      store.set(this.correlationIdKey, correlationId);
    }
    
    return correlationId || '';
  }

  /**
   * Set correlation ID in context
   */
  static setCorrelationId(correlationId: string): void {
    this.set(this.correlationIdKey, correlationId);
  }

  /**
   * Clear all context data
   * Useful for cleanup or testing
   */
  static clear(): void {
    this.storage.getStore()?.clear();
  }

  /**
   * Check if we're currently in a context
   */
  static isActive(): boolean {
    return this.storage.getStore() !== undefined;
  }
}

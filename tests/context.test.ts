/**
 * Tests for AsyncContext
 * Tests for context propagation across async operations
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { AsyncContext } from '../src/context/Context';

describe('AsyncContext', () => {
  beforeEach(() => {
    // Clear any existing context between tests
    AsyncContext.clear();
  });

  describe('set and get', () => {
    it('should set and get value', () => {
      AsyncContext.run(() => {
        AsyncContext.set('key', 'value');
        expect(AsyncContext.get('key')).toBe('value');
      });
    });

    it('should return undefined for non-existent key', () => {
      AsyncContext.run(() => {
        expect(AsyncContext.get('nonexistent')).toBeUndefined();
      });
    });

    it('should overwrite existing value', () => {
      AsyncContext.run(() => {
        AsyncContext.set('key', 'value1');
        AsyncContext.set('key', 'value2');
        expect(AsyncContext.get('key')).toBe('value2');
      });
    });
  });

  describe('run (synchronous)', () => {
    it('should create context for synchronous code', () => {
      let captured: string | undefined;

      AsyncContext.run(() => {
        AsyncContext.set('correlationId', 'corr-123');
        captured = AsyncContext.get('correlationId') as string;
      });

      expect(captured).toBe('corr-123');
    });

    it('should isolate context between runs', () => {
      let value1: string | undefined;
      let value2: string | undefined;

      AsyncContext.run(() => {
        AsyncContext.set('key', 'value1');
        value1 = AsyncContext.get('key') as string;
      });

      AsyncContext.run(() => {
        AsyncContext.set('key', 'value2');
        value2 = AsyncContext.get('key') as string;
      });

      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
    });

    it('should accept initial data', () => {
      let captured: { correlationId?: string; userId?: number } = {};

      AsyncContext.run(
        () => {
          captured = {
            correlationId: AsyncContext.get('correlationId') as string,
            userId: AsyncContext.get('userId') as number,
          };
        },
        { correlationId: 'corr-123', userId: 456 }
      );

      expect(captured.correlationId).toBe('corr-123');
      expect(captured.userId).toBe(456);
    });
  });

  describe('runAsync (asynchronous)', () => {
    it('should propagate context in async operations', async () => {
      let captured: string | undefined;

      await AsyncContext.runAsync(async () => {
        AsyncContext.set('correlationId', 'corr-123');

        await Promise.resolve();

        captured = AsyncContext.get('correlationId') as string;
      });

      expect(captured).toBe('corr-123');
    });

    it('should isolate context between async runs', async () => {
      let value1: string | undefined;
      let value2: string | undefined;

      await AsyncContext.runAsync(async () => {
        AsyncContext.set('key', 'value1');
        await Promise.resolve();
        value1 = AsyncContext.get('key') as string;
      });

      await AsyncContext.runAsync(async () => {
        AsyncContext.set('key', 'value2');
        await Promise.resolve();
        value2 = AsyncContext.get('key') as string;
      });

      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
    });

    it('should accept initial data in async context', async () => {
      let captured: { correlationId?: string } = {};

      await AsyncContext.runAsync(
        async () => {
          await Promise.resolve();
          captured = {
            correlationId: AsyncContext.get('correlationId') as string,
          };
        },
        { correlationId: 'corr-123' }
      );

      expect(captured.correlationId).toBe('corr-123');
    });

    it('should maintain context across multiple awaits', async () => {
      const values: string[] = [];

      await AsyncContext.runAsync(async () => {
        AsyncContext.set('correlationId', 'corr-123');

        await Promise.resolve();
        values.push(AsyncContext.get('correlationId') as string);

        await Promise.resolve();
        values.push(AsyncContext.get('correlationId') as string);
      });

      expect(values).toEqual(['corr-123', 'corr-123']);
    });
  });

  describe('getCorrelationId', () => {
    it('should return correlation ID from default key', () => {
      AsyncContext.run(() => {
        AsyncContext.set('correlationId', 'corr-123');
        expect(AsyncContext.getCorrelationId()).toBe('corr-123');
      });
    });

    it('should return empty string if correlation ID not set and autoGenerate disabled', () => {
      // Disable auto-generate for this test
      const originalAutoGenerate = (AsyncContext as any).config.autoGenerate;
      (AsyncContext as any).config.autoGenerate = false;

      AsyncContext.run(() => {
        expect(AsyncContext.getCorrelationId()).toBe('');
      });

      // Restore
      (AsyncContext as any).config.autoGenerate = originalAutoGenerate;
    });
  });

  describe('setCorrelationId', () => {
    it('should set correlation ID using default key', () => {
      AsyncContext.run(() => {
        AsyncContext.setCorrelationId('corr-123');
        expect(AsyncContext.get('correlationId')).toBe('corr-123');
      });
    });
  });

  describe('getAll', () => {
    it('should return all context values', () => {
      AsyncContext.run(() => {
        AsyncContext.set('key1', 'value1');
        AsyncContext.set('key2', 'value2');

        const all = AsyncContext.getAll();

        expect(all.key1).toBe('value1');
        expect(all.key2).toBe('value2');
      });
    });

    it('should return empty object when no context', () => {
      AsyncContext.run(() => {
        const all = AsyncContext.getAll();
        expect(Object.keys(all).length).toBe(0);
      });
    });
  });

  describe('clear', () => {
    it('should clear all context', () => {
      AsyncContext.run(() => {
        AsyncContext.set('key', 'value');
        AsyncContext.clear();

        expect(AsyncContext.get('key')).toBeUndefined();
        expect(AsyncContext.getAll()).toEqual({});
      });
    });
  });

  describe('Nested Contexts', () => {
    it('should isolate nested context runs', () => {
      let outer: string | undefined;
      let inner: string | undefined;

      AsyncContext.run(() => {
        AsyncContext.set('key', 'outer');
        outer = AsyncContext.get('key') as string;

        AsyncContext.run(() => {
          AsyncContext.set('key', 'inner');
          inner = AsyncContext.get('key') as string;
        });

        // Outer context should be preserved
        expect(AsyncContext.get('key')).toBe('outer');
      });

      expect(outer).toBe('outer');
      expect(inner).toBe('inner');
    });
  });
});

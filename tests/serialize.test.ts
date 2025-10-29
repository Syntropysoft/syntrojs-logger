/**
 * Tests for serialize utilities
 */

import { describe, expect, it } from 'vitest';
import { safeStringify, serialize } from '../src/utils/serialize';

describe('serialize', () => {
  describe('Primitives', () => {
    it('should return primitives as-is', () => {
      expect(serialize(null)).toBe(null);
      expect(serialize(undefined)).toBe(undefined);
      expect(serialize('string')).toBe('string');
      expect(serialize(123)).toBe(123);
      expect(serialize(true)).toBe(true);
      expect(serialize(false)).toBe(false);
    });
  });

  describe('Date Objects', () => {
    it('should serialize Date to ISO string', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = serialize(date);
      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should serialize Date in nested objects', () => {
      const obj = { timestamp: new Date('2024-01-01T00:00:00Z') };
      const result = serialize(obj);
      expect(result).toEqual({ timestamp: '2024-01-01T00:00:00.000Z' });
    });
  });

  describe('RegExp Objects', () => {
    it('should serialize RegExp to object', () => {
      const regex = /test/i;
      const result = serialize(regex);
      expect(result).toEqual({ source: 'test', flags: 'i' });
    });

    it('should serialize RegExp in nested objects', () => {
      const obj = { pattern: /test/i };
      const result = serialize(obj);
      expect(result).toEqual({ pattern: { source: 'test', flags: 'i' } });
    });
  });

  describe('Error Objects', () => {
    it('should serialize Error with message, name, and stack', () => {
      const error = new Error('Test error');
      const result = serialize(error);

      expect(result).toHaveProperty('message', 'Test error');
      expect(result).toHaveProperty('name', 'Error');
      expect(result).toHaveProperty('stack');
    });

    it('should serialize custom Error properties', () => {
      const error = new Error('Test') as Error & { code: string; status: number };
      error.code = 'E_TEST';
      error.status = 500;

      const result = serialize(error);

      expect(result).toHaveProperty('message', 'Test');
      expect(result).toHaveProperty('code', 'E_TEST');
      expect(result).toHaveProperty('status', 500);
    });

    it('should serialize nested Errors', () => {
      const error = new Error('Outer');
      (error as any).inner = new Error('Inner');

      const result = serialize(error);

      expect(result).toHaveProperty('message', 'Outer');
      expect((result as any).inner).toHaveProperty('message', 'Inner');
    });
  });

  describe('Arrays', () => {
    it('should serialize arrays with primitives', () => {
      const arr = [1, 'string', true, null];
      const result = serialize(arr);
      expect(result).toEqual([1, 'string', true, null]);
    });

    it('should serialize arrays with objects', () => {
      const arr = [{ id: 1 }, { id: 2 }];
      const result = serialize(arr);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should serialize arrays with Dates', () => {
      const date = new Date('2024-01-01');
      const arr = [date];
      const result = serialize(arr);
      expect(result[0]).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('Circular References', () => {
    it('should handle circular references in objects', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      const result = serialize(obj);
      expect(result).toEqual({ name: 'test', self: '[Circular]' });
    });

    it('should handle circular references in arrays', () => {
      const arr: any[] = [1, 2];
      arr.push(arr);

      const result = serialize(arr);
      expect(result).toEqual([1, 2, '[Circular]']);
    });

    it('should handle deeply nested circular references', () => {
      const obj: any = { level1: { level2: {} } };
      obj.level1.level2.circular = obj;

      const result = serialize(obj);
      expect((result as any).level1.level2.circular).toBe('[Circular]');
    });
  });

  describe('Complex Nested Structures', () => {
    it('should serialize deeply nested objects', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      const result = serialize(obj);
      expect((result as any).level1.level2.level3.value).toBe('deep');
    });

    it('should serialize objects with mixed types', () => {
      const obj = {
        string: 'value',
        number: 123,
        boolean: true,
        date: new Date('2024-01-01'),
        regex: /test/,
        error: new Error('test'),
        array: [1, 2, 3],
        nested: { key: 'value' },
      };

      const result = serialize(obj);
      expect(result).toHaveProperty('string', 'value');
      expect(result).toHaveProperty('number', 123);
      expect(result).toHaveProperty('boolean', true);
      expect((result as any).date).toBe('2024-01-01T00:00:00.000Z');
      expect((result as any).regex).toEqual({ source: 'test', flags: '' });
      expect((result as any).error).toHaveProperty('message', 'test');
      expect((result as any).array).toEqual([1, 2, 3]);
      expect((result as any).nested).toEqual({ key: 'value' });
    });
  });
});

describe('safeStringify', () => {
  it('should stringify simple objects', () => {
    const obj = { key: 'value' };
    const result = safeStringify(obj);
    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
  });

  it('should handle circular references gracefully', () => {
    const obj: any = { name: 'test' };
    obj.self = obj;

    const result = safeStringify(obj);
    expect(result).toContain('[Circular]');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should handle Errors', () => {
    const error = new Error('Test error');
    const result = safeStringify(error);

    expect(result).toContain('"message"');
    expect(result).toContain('Test error');
  });

  it('should handle Dates', () => {
    const date = new Date('2024-01-01');
    const result = safeStringify({ date });

    expect(result).toContain('"2024-01-01T00:00:00.000Z"');
  });

  it('should return String(obj) on stringify failure', () => {
    // Create object that causes stringify to fail
    const circular: any = {};
    circular.self = circular;

    // This should still work, but test edge case
    const result = safeStringify(circular);
    expect(typeof result).toBe('string');
  });
});

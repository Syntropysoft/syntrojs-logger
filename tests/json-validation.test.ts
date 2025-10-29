/**
 * Tests for JSON validation utilities
 * Tests for plain JSON validation to prevent code injection
 */

import { describe, it, expect } from 'vitest';
import {
  isPlainObject,
  isValidJsonPrimitive,
  validatePlainJson,
  validateAndSanitizeJson,
} from '../src/utils/jsonValidation';

describe('JSON Validation', () => {
  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ key: 'value' })).toBe(true);
      // Object.create(null) doesn't have Object constructor, so it's not a "plain object"
      // according to our definition (must have constructor === Object)
    });

    it('should return false for class instances', () => {
      class CustomClass {}
      expect(isPlainObject(new CustomClass())).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(new Array())).toBe(false);
      expect(isPlainObject([])).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(123)).toBe(false);
      expect(isPlainObject(true)).toBe(false);
    });
  });

  describe('isValidJsonPrimitive', () => {
    it('should accept valid primitives', () => {
      expect(isValidJsonPrimitive(null)).toBe(true);
      expect(isValidJsonPrimitive('string')).toBe(true);
      expect(isValidJsonPrimitive(123)).toBe(true);
      expect(isValidJsonPrimitive(true)).toBe(true);
      expect(isValidJsonPrimitive(false)).toBe(true);
    });

    it('should reject invalid primitives', () => {
      expect(isValidJsonPrimitive(undefined)).toBe(false);
      expect(isValidJsonPrimitive(() => {})).toBe(false);
      expect(isValidJsonPrimitive(Symbol('test'))).toBe(false);
      expect(isValidJsonPrimitive(BigInt(123))).toBe(false);
    });
  });

  describe('validatePlainJson', () => {
    it('should validate plain objects', () => {
      expect(() => {
        validatePlainJson({ key: 'value' });
      }).not.toThrow();
    });

    it('should validate nested plain objects', () => {
      expect(() => {
        validatePlainJson({
          level1: {
            level2: {
              level3: 'value',
            },
          },
        });
      }).not.toThrow();
    });

    it('should validate arrays of primitives', () => {
      expect(() => {
        validatePlainJson([1, 2, 3, 'string', true, null]);
      }).not.toThrow();
    });

    it('should validate arrays of plain objects', () => {
      expect(() => {
        validatePlainJson([
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ]);
      }).not.toThrow();
    });

    it('should reject class instances', () => {
      class CustomClass {
        value = 'test';
      }
      
      expect(() => {
        validatePlainJson({
          instance: new CustomClass(),
        });
      }).toThrow(/Class instance found/i);
    });

    it('should reject functions', () => {
      expect(() => {
        validatePlainJson({
          fn: () => {},
        });
      }).toThrow(/Function found/i);
    });

    it('should reject undefined values', () => {
      expect(() => {
        validatePlainJson({
          value: undefined,
        });
      }).toThrow(/Invalid type/i);
    });

    it('should reject Symbol values', () => {
      expect(() => {
        validatePlainJson({
          symbol: Symbol('test'),
        });
      }).toThrow(/Invalid type/i);
    });

    it('should reject BigInt values', () => {
      expect(() => {
        validatePlainJson({
          bigint: BigInt(123),
        });
      }).toThrow(/Invalid type/i);
    });

    it('should reject Date instances', () => {
      expect(() => {
        validatePlainJson({
          date: new Date(),
        });
      }).toThrow(/Class instance found/i);
    });
  });

  describe('validateAndSanitizeJson', () => {
    it('should return valid plain JSON as-is', () => {
      const input = { key: 'value', number: 123 };
      const result = validateAndSanitizeJson(input);
      
      expect(result).toEqual(input);
      expect(result).not.toBe(input); // Should be a copy
    });

    it('should remove invalid properties', () => {
      class CustomClass {
        value = 'test';
      }
      
      const input = {
        valid: 'value',
        invalid: new CustomClass(),
      };
      
      const result = validateAndSanitizeJson(input);
      
      expect(result.valid).toBe('value');
      expect(result.invalid).toBeUndefined();
    });

    it('should handle nested objects with invalid properties', () => {
      class CustomClass {
        value = 'test';
      }
      
      const input = {
        level1: {
          valid: 'value',
          level2: {
            invalid: new CustomClass(),
            valid: 123,
          },
        },
      };
      
      const result = validateAndSanitizeJson(input);
      
      expect(result.level1.valid).toBe('value');
      expect(result.level1.level2.invalid).toBeUndefined();
      expect(result.level1.level2.valid).toBe(123);
    });

    it('should filter invalid array elements', () => {
      const input = {
        items: [
          'valid',
          () => {}, // Invalid
          123,
          new Date(), // Invalid
          null,
        ],
      };
      
      const result = validateAndSanitizeJson(input);
      
      expect(result.items).toEqual(['valid', 123, null]);
    });

    it('should handle arrays of objects with invalid properties', () => {
      class CustomClass {
        value = 'test';
      }
      
      const input = {
        items: [
          { valid: 'value', invalid: new CustomClass() },
          { valid: 123 },
        ],
      };
      
      const result = validateAndSanitizeJson(input);
      
      expect(result.items[0].valid).toBe('value');
      expect(result.items[0].invalid).toBeUndefined();
      expect(result.items[1].valid).toBe(123);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects', () => {
      expect(() => {
        validatePlainJson({});
      }).not.toThrow();
    });

    it('should handle empty arrays', () => {
      expect(() => {
        validatePlainJson([]);
      }).not.toThrow();
    });

    it('should handle null values', () => {
      expect(() => {
        validatePlainJson({ value: null });
      }).not.toThrow();
    });

    it('should handle deeply nested structures', () => {
      const deep = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'value',
              },
            },
          },
        },
      };
      
      expect(() => {
        validatePlainJson(deep);
      }).not.toThrow();
      
      const result = validateAndSanitizeJson(deep);
      expect(result.level1.level2.level3.level4.level5).toBe('value');
    });
  });
});


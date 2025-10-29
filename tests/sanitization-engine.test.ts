/**
 * Tests for SanitizationEngine
 * Tests for ANSI code removal and log injection prevention
 */

import { describe, it, expect } from 'vitest';
import { SanitizationEngine } from '../src/sanitization/SanitizationEngine';
import { MaskingEngine } from '../src/masking/MaskingEngine';

describe('SanitizationEngine', () => {
  describe('Constructor', () => {
    it('should create engine without masking', () => {
      const engine = new SanitizationEngine();
      
      expect(engine).toBeInstanceOf(SanitizationEngine);
    });

    it('should create engine with masking integration', () => {
      const masking = new MaskingEngine();
      const engine = new SanitizationEngine(masking);
      
      expect(engine).toBeInstanceOf(SanitizationEngine);
    });
  });

  describe('ANSI Code Removal', () => {
    it('should remove ANSI escape codes from strings', () => {
      const engine = new SanitizationEngine();
      
      const input = '\x1b[31mRed Text\x1b[0m';
      const result = engine.process({ message: input });
      
      expect(result.message).toBe('Red Text');
    });

    it('should remove multiple ANSI codes', () => {
      const engine = new SanitizationEngine();
      
      const input = '\x1b[32mGreen\x1b[0m \x1b[33mYellow\x1b[0m';
      const result = engine.process({ message: input });
      
      expect(result.message).toBe('Green Yellow');
    });

    it('should handle incomplete ANSI codes gracefully', () => {
      const engine = new SanitizationEngine();
      
      const input = '\x1b[31mText\x1b';
      const result = engine.process({ message: input });
      
      expect(result.message).not.toContain('\x1b');
    });
  });

  describe('Nested Objects', () => {
    it('should sanitize nested objects recursively', () => {
      const engine = new SanitizationEngine();
      
      const result = engine.process({
        user: {
          name: '\x1b[31mRed\x1b[0m',
          message: 'Normal text',
          profile: {
            bio: '\x1b[32mGreen\x1b[0m bio',
          },
        },
      });
      
      expect(result.user.name).toBe('Red');
      expect(result.user.message).toBe('Normal text');
      expect(result.user.profile.bio).toBe('Green bio');
    });

    it('should sanitize arrays of strings', () => {
      const engine = new SanitizationEngine();
      
      const result = engine.process({
        messages: [
          '\x1b[31mError\x1b[0m',
          'Normal',
          '\x1b[32mSuccess\x1b[0m',
        ],
      });
      
      expect(result.messages[0]).toBe('Error');
      expect(result.messages[1]).toBe('Normal');
      expect(result.messages[2]).toBe('Success');
    });
  });

  describe('Plain Object Protection', () => {
    it('should only process plain objects (not class instances)', () => {
      const engine = new SanitizationEngine();
      
      class CustomClass {
        value = '\x1b[31mRed\x1b[0m';
      }
      
      const instance = new CustomClass();
      const result = engine.process({ instance });
      
      // Should not modify class instances
      expect(result.instance).toBe(instance);
      expect(result.instance.value).toBe('\x1b[31mRed\x1b[0m');
    });

    it('should process plain objects with same structure', () => {
      const engine = new SanitizationEngine();
      
      const plainObject = {
        value: '\x1b[31mRed\x1b[0m',
      };
      
      const result = engine.process({ plainObject });
      
      expect(result.plainObject.value).toBe('Red');
    });
  });

  describe('Masking Integration', () => {
    it('should apply masking before sanitization', () => {
      const masking = new MaskingEngine({ enableDefaultRules: false });
      masking.addRule({
        pattern: /email/i,
        strategy: 'email' as any,
      });
      
      const engine = new SanitizationEngine(masking);
      
      const result = engine.process({
        email: '\x1b[31muser@example.com\x1b[0m',
      });
      
      // Should mask email and remove ANSI codes
      expect(result.email).toBe('u***@example.com');
      expect(result.email).not.toContain('\x1b');
    });

    it('should handle masking errors gracefully', () => {
      const masking = new MaskingEngine();
      const engine = new SanitizationEngine(masking);
      
      // Should not throw even if masking fails internally
      expect(() => {
        engine.process({
          test: '\x1b[31mtest\x1b[0m',
        });
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const engine = new SanitizationEngine();
      
      const result = engine.process({
        value: null,
      });
      
      expect(result.value).toBeNull();
    });

    it('should handle undefined values', () => {
      const engine = new SanitizationEngine();
      
      const result = engine.process({
        value: undefined,
      });
      
      expect(result.value).toBeUndefined();
    });

    it('should handle empty strings', () => {
      const engine = new SanitizationEngine();
      
      const result = engine.process({
        value: '',
      });
      
      expect(result.value).toBe('');
    });

    it('should handle numbers', () => {
      const engine = new SanitizationEngine();
      
      const result = engine.process({
        value: 123,
      });
      
      expect(result.value).toBe(123);
    });

    it('should handle booleans', () => {
      const engine = new SanitizationEngine();
      
      const result = engine.process({
        value: true,
      });
      
      expect(result.value).toBe(true);
    });
  });
});


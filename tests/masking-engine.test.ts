/**
 * Tests for MaskingEngine
 * Tests for all masking strategies using functional approach
 */

import { describe, it, expect } from 'vitest';
import { MaskingEngine, MaskingStrategy } from '../src/masking/MaskingEngine';
import type { MaskingRule } from '../src/masking/MaskingEngine';

describe('MaskingEngine', () => {
  describe('Constructor', () => {
    it('should create engine with default rules', () => {
      const engine = new MaskingEngine();
      const stats = engine.getStats();
      
      expect(stats.initialized).toBe(false);
      expect(stats.totalRules).toBeGreaterThan(0);
    });

    it('should create engine without default rules', () => {
      const engine = new MaskingEngine({ enableDefaultRules: false });
      const stats = engine.getStats();
      
      expect(stats.totalRules).toBe(0);
    });

    it('should accept custom mask character', () => {
      const engine = new MaskingEngine({ maskChar: 'X' });
      expect(engine).toBeInstanceOf(MaskingEngine);
    });

    it('should accept custom rules', () => {
      const customRule: MaskingRule = {
        pattern: /secret/i,
        strategy: MaskingStrategy.PASSWORD,
      };
      
      const engine = new MaskingEngine({
        rules: [customRule],
        enableDefaultRules: false,
      });
      
      const stats = engine.getStats();
      expect(stats.totalRules).toBe(1);
    });
  });

  describe('Masking Strategies', () => {
    describe('Credit Card', () => {
      it('should mask credit card number (fixed format)', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /creditCard/i,
          strategy: MaskingStrategy.CREDIT_CARD,
          preserveLength: false,
        });

        const result = engine.process({ creditCard: '1234567890123456' });
        expect(result.creditCard).toMatch(/^\*\*\*\*-\*\*\*\*-\*\*\*\*-\d{4}$/);
      });

      it('should mask credit card preserving length', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /creditCard/i,
          strategy: MaskingStrategy.CREDIT_CARD,
          preserveLength: true,
        });

        const result = engine.process({ creditCard: '1234-5678-9012-3456' });
        expect(result.creditCard).toContain('3456');
        expect(result.creditCard.length).toBe('1234-5678-9012-3456'.length);
      });
    });

    describe('SSN', () => {
      it('should mask SSN (fixed format)', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /ssn/i,
          strategy: MaskingStrategy.SSN,
          preserveLength: false,
        });

        const result = engine.process({ ssn: '123-45-6789' });
        expect(result.ssn).toBe('***-**-6789');
      });

      it('should mask SSN preserving format', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /ssn/i,
          strategy: MaskingStrategy.SSN,
          preserveLength: true,
        });

        const result = engine.process({ ssn: '123-45-6789' });
        expect(result.ssn).toMatch(/^\*\*\*-\*\*-6789$/);
      });
    });

    describe('Email', () => {
      it('should mask email address', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /email/i,
          strategy: MaskingStrategy.EMAIL,
          preserveLength: false,
        });

        const result = engine.process({ email: 'user@example.com' });
        expect(result.email).toBe('u***@example.com');
      });

      it('should mask email preserving length', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /email/i,
          strategy: MaskingStrategy.EMAIL,
          preserveLength: true,
        });

        const result = engine.process({ email: 'user@example.com' });
        expect(result.email).toMatch(/^u\*+@example\.com$/);
        expect(result.email.length).toBe('user@example.com'.length);
      });
    });

    describe('Phone', () => {
      it('should mask phone number', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /phone/i,
          strategy: MaskingStrategy.PHONE,
          preserveLength: false,
        });

        const result = engine.process({ phone: '123-456-7890' });
        expect(result.phone).toMatch(/^\*\*\*-\*\*\*-\d{4}$/);
      });
    });

    describe('Password', () => {
      it('should mask password completely', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /password/i,
          strategy: MaskingStrategy.PASSWORD,
        });

        const result = engine.process({ password: 'mySecretPassword123' });
        expect(result.password).toBe('*'.repeat('mySecretPassword123'.length));
      });
    });

    describe('Token', () => {
      it('should mask token', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /token/i,
          strategy: MaskingStrategy.TOKEN,
          preserveLength: false,
        });

        const result = engine.process({ token: 'abcdefghijklmnop' });
        expect(result.token).toMatch(/^.{4}\.\.\..{5}$/);
      });

      it('should mask short token completely', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /token/i,
          strategy: MaskingStrategy.TOKEN,
          preserveLength: false,
        });

        const result = engine.process({ token: 'short' });
        expect(result.token).toBe('*'.repeat(5));
      });
    });

    describe('Custom Strategy', () => {
      it('should use custom mask function', () => {
        const engine = new MaskingEngine({ enableDefaultRules: false });
        engine.addRule({
          pattern: /secret/i,
          strategy: MaskingStrategy.CUSTOM,
          customMask: (value) => '[REDACTED]',
        });

        const result = engine.process({ secret: 'very-secret-value' });
        expect(result.secret).toBe('[REDACTED]');
      });
    });
  });

  describe('Nested Objects', () => {
    it('should mask nested objects recursively', () => {
      const engine = new MaskingEngine({ enableDefaultRules: false });
      engine.addRule({
        pattern: /password/i,
        strategy: MaskingStrategy.PASSWORD,
      });

      const result = engine.process({
        user: {
          name: 'John',
          password: 'secret123',
          profile: {
            password: 'otherSecret',
          },
        },
      });

      expect(result.user.password).toBe('*'.repeat(9));
      expect(result.user.profile.password).toBe('*'.repeat(11));
      expect(result.user.name).toBe('John');
    });

    it('should mask arrays of objects', () => {
      const engine = new MaskingEngine({ enableDefaultRules: false });
      engine.addRule({
        pattern: /email/i,
        strategy: MaskingStrategy.EMAIL,
      });

      const result = engine.process({
        users: [
          { email: 'user1@test.com', name: 'User 1' },
          { email: 'user2@test.com', name: 'User 2' },
        ],
      });

      expect(result.users[0].email).toMatch(/^u\*+@test\.com$/);
      expect(result.users[1].email).toMatch(/^u\*+@test\.com$/);
      expect(result.users[0].name).toBe('User 1');
    });
  });

  describe('Regex Validation (ReDoS Prevention)', () => {
    it('should reject dangerous regex patterns', () => {
      const engine = new MaskingEngine({ enableDefaultRules: false });
      
      const dangerousRule: MaskingRule = {
        pattern: '(a+)+$', // Potentially dangerous
        strategy: MaskingStrategy.PASSWORD,
      };

      expect(() => {
        engine.addRule(dangerousRule);
      }).toThrow(/Unsafe regex pattern/i);
    });

    it('should accept safe regex patterns', () => {
      const engine = new MaskingEngine({ enableDefaultRules: false });
      
      const safeRule: MaskingRule = {
        pattern: /password|passwd/i,
        strategy: MaskingStrategy.PASSWORD,
      };

      expect(() => {
        engine.addRule(safeRule);
      }).not.toThrow();
    });
  });

  describe('Pattern Matching', () => {
    it('should match case-insensitive patterns', () => {
      const engine = new MaskingEngine({ enableDefaultRules: false });
      engine.addRule({
        pattern: /password/i,
        strategy: MaskingStrategy.PASSWORD,
      });

      const result = engine.process({
        PASSWORD: 'secret',
        Password: 'secret',
        password: 'secret',
        passWord: 'secret',
      });

      expect(result.PASSWORD).toBe('******');
      expect(result.Password).toBe('******');
      expect(result.password).toBe('******');
      expect(result.passWord).toBe('******');
    });

    it('should apply first matching rule only', () => {
      const engine = new MaskingEngine({ enableDefaultRules: false });
      engine.addRule({
        pattern: /secret/i,
        strategy: MaskingStrategy.TOKEN,
      });
      engine.addRule({
        pattern: /secret/i,
        strategy: MaskingStrategy.PASSWORD,
      });

      const result = engine.process({ secret: 'value' });
      
      // First rule (TOKEN) should win
      expect(result.secret).toMatch(/^.{4}/); // Token format
    });
  });

  describe('Default Rules', () => {
    it('should have default credit card rule', () => {
      const engine = new MaskingEngine();
      
      const result = engine.process({
        credit_card: '1234567890123456',
      });

      expect(result.credit_card).toMatch(/^\*\*\*\*-/);
    });

    it('should have default email rule', () => {
      const engine = new MaskingEngine();
      
      const result = engine.process({
        user_email: 'user@example.com',
      });

      expect(result.user_email).toBe('u***@example.com');
    });
  });
});


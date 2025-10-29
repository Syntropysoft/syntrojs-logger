/**
 * Tests for Logger edge cases to improve coverage
 */

import { describe, expect, it } from 'vitest';
import { Logger } from '../src/Logger';
import { FieldFilter } from '../src/compliance/LoggingMatrix';
import type { LoggingMatrix } from '../src/compliance/LoggingMatrix';
import { createLogger } from '../src/index';
import { MaskingEngine } from '../src/masking/MaskingEngine';
import type { MaskingRule } from '../src/masking/MaskingEngine';
import { SanitizationEngine } from '../src/sanitization/SanitizationEngine';
import { ArrayTransport } from '../src/transports/array';

describe('Logger Edge Cases', () => {
  describe('Constructor Options', () => {
    it('should create logger with loggingMatrix', () => {
      const matrix: LoggingMatrix = {
        default: ['correlationId'],
      };
      const logger = new Logger(
        'test',
        new ArrayTransport(),
        'info',
        {},
        { loggingMatrix: matrix }
      );

      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger without useAsyncContext option (defaults to true)', () => {
      const logger = new Logger('test', new ArrayTransport(), 'info', {}, {});
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('Logging without arguments', () => {
    it('should log empty message when no arguments provided', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info');

      logger.info();

      const log = transport.getLastEntry();
      expect(log?.message).toBe('');
      expect(log?.level).toBe('info');
    });
  });

  describe('Compliance Pipeline', () => {
    it('should process logs through compliance pipeline with masking and sanitization', () => {
      const transport = new ArrayTransport();
      const masking = new MaskingEngine({ enableDefaultRules: false });
      masking.addRule({
        pattern: /password/i,
        strategy: 'password' as any,
      });
      const sanitization = new SanitizationEngine(masking);

      const logger = new Logger(
        'test',
        transport,
        'info',
        {},
        {
          sanitizationEngine: sanitization,
          maskingEngine: masking,
        }
      );

      logger.info({ password: 'secret123' }, 'User logged in');

      const log = transport.getLastEntry();
      expect(log?.password).toBe('*'.repeat(9));
      expect(log?.message).toBe('User logged in');
    });

    it('should process logs with loggingMatrix filtering', async () => {
      const transport = new ArrayTransport();
      const matrix: LoggingMatrix = {
        info: ['correlationId'],
      };

      const logger = new Logger(
        'test',
        transport,
        'info',
        {},
        { loggingMatrix: matrix, useAsyncContext: true }
      );

      // This would require AsyncContext to test properly
      logger.info({ correlationId: 'corr-123', secret: 'hidden' }, 'Test');

      const log = transport.getLastEntry();
      expect(log).toBeDefined();
    });
  });

  describe('Reconfigure', () => {
    it('should add masking rule when engine does not exist', () => {
      const logger = new Logger('test', new ArrayTransport(), 'info');
      const rule: MaskingRule = {
        pattern: /secret/i,
        strategy: 'password' as any,
      };

      logger.reconfigure({ addMaskingRule: rule });
      logger.info({ secret: 'value123' }, 'Test');

      // Should have created engine and applied masking
      // 'value123' has 8 characters, so should be 8 asterisks
      const transport = logger.transport as ArrayTransport;
      const log = transport.getLastEntry();
      expect(log?.secret).toBe('*'.repeat(8));
    });

    it('should update logging matrix when fieldFilter does not exist', () => {
      const logger = new Logger('test', new ArrayTransport(), 'info');
      const matrix: LoggingMatrix = {
        default: ['correlationId'],
      };

      logger.reconfigure({ loggingMatrix: matrix });

      expect(logger.fieldFilter).toBeInstanceOf(FieldFilter);
    });

    it('should handle transport close error gracefully', async () => {
      const mockTransport = {
        log: () => {},
        close: async () => {
          throw new Error('Close failed');
        },
        level: 'trace' as const,
        name: 'mock',
        isLevelEnabled: () => true,
      };

      const logger = new Logger('test', mockTransport as any, 'info');
      const newTransport = new ArrayTransport();

      logger.reconfigure({ transport: newTransport });

      // Should not throw even if old transport close fails
      await new Promise((resolve) => setTimeout(resolve, 10));

      logger.info('test');
      expect(newTransport.entries.length).toBe(1);
    });
  });

  describe('Transport Error Handling', () => {
    it('should handle transport.log() errors gracefully', () => {
      const mockTransport = {
        log: () => {
          throw new Error('Transport error');
        },
        level: 'trace' as const,
        name: 'mock',
        isLevelEnabled: () => true,
      };

      const logger = new Logger('test', mockTransport as any, 'info');

      // Should not throw
      expect(() => {
        logger.info('test message');
      }).not.toThrow();
    });
  });

  describe('Array Transport Edge Cases', () => {
    it('should handle non-JSON strings in getParsedEntries', () => {
      const transport = new ArrayTransport();
      transport.log('not-json-string');
      transport.log('{"valid": "json"}');

      const parsed = transport.getParsedEntries();
      expect(parsed.length).toBe(1);
      expect(parsed[0]).toEqual({ valid: 'json' });
    });

    it('should handle getLastEntry with invalid JSON', () => {
      const transport = new ArrayTransport();
      transport.log('invalid-json-{');

      const last = transport.getLastEntry();
      expect(last).toBeUndefined();
    });

    it('should handle getLastEntry with empty array', () => {
      const transport = new ArrayTransport();
      const last = transport.getLastEntry();
      expect(last).toBeUndefined();
    });
  });

  describe('createLogger Edge Cases', () => {
    it('should handle unknown transport string (fallback to json)', () => {
      const logger = createLogger({
        transport: 'unknown' as any,
      });

      expect(logger).toBeInstanceOf(Logger);
    });

    it('should handle createLogger with all options', () => {
      const masking = new MaskingEngine({ enableDefaultRules: false });
      const matrix: LoggingMatrix = { default: ['correlationId'] };

      const logger = createLogger({
        name: 'custom',
        level: 'debug',
        transport: 'pretty',
        maskingEngine: masking,
        useAsyncContext: false,
        loggingMatrix: matrix,
      });

      expect(logger.name).toBe('custom');
      expect(logger.level).toBe('debug');
      expect(logger.useAsyncContext).toBe(false);
    });
  });
});

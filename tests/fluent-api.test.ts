/**
 * Tests for Fluent API methods
 */

import { describe, expect, it } from 'vitest';
import { type LogRetentionRules, createLogger } from '../src/index';
import { ArrayTransport } from '../src/transports/array';

describe('Fluent API', () => {
  describe('withSource()', () => {
    it('should create a child logger with source binding', () => {
      const parentLogger = createLogger({ name: 'test' });
      const childLogger = parentLogger.withSource('redis');

      expect(childLogger).not.toBe(parentLogger);
      expect(childLogger.name).toBe(parentLogger.name);
    });

    it('should include source in log output', () => {
      const transport = new ArrayTransport();
      const logger = createLogger({ name: 'test', transport });
      const sourceLogger = logger.withSource('api');

      sourceLogger.info('Test message');

      const logEntry = transport.getLastEntry();
      expect(logEntry?.source).toBe('api');
    });

    it('should allow chaining', () => {
      const logger = createLogger({ name: 'test' });
      const chainedLogger = logger.withSource('module1').withSource('module2');

      expect(chainedLogger).not.toBe(logger);
    });
  });

  describe('withTransactionId()', () => {
    it('should create a child logger with transactionId binding', () => {
      const parentLogger = createLogger({ name: 'test' });
      const childLogger = parentLogger.withTransactionId('tx-abc-123');

      expect(childLogger).not.toBe(parentLogger);
      expect(childLogger.name).toBe(parentLogger.name);
    });

    it('should include transactionId in log output', () => {
      const transport = new ArrayTransport();
      const logger = createLogger({ name: 'test', transport });
      const txLogger = logger.withTransactionId('tx-xyz-789');

      txLogger.info('Test message');

      const logEntry = transport.getLastEntry();
      expect(logEntry?.transactionId).toBe('tx-xyz-789');
    });

    it('should allow chaining with other fluent methods', () => {
      const logger = createLogger({ name: 'test' });
      const chainedLogger = logger.withSource('api').withTransactionId('tx-123');

      expect(chainedLogger).not.toBe(logger);
    });
  });

  describe('withRetention()', () => {
    it('should create a child logger with retention rules binding', () => {
      const parentLogger = createLogger({ name: 'test' });
      const rules: LogRetentionRules = {
        ttl: 3600,
        maxEntries: 10000,
      };
      const childLogger = parentLogger.withRetention(rules);

      expect(childLogger).not.toBe(parentLogger);
      expect(childLogger.name).toBe(parentLogger.name);
    });

    it('should include retention rules in log output', () => {
      const transport = new ArrayTransport();
      const logger = createLogger({ name: 'test', transport });
      const rules: LogRetentionRules = {
        ttl: 3600,
        maxEntries: 10000,
        archiveAfter: 259200,
        deleteAfter: 2592000,
      };
      const retentionLogger = logger.withRetention(rules);

      retentionLogger.info('Test message');

      const logEntry = transport.getLastEntry();
      expect(logEntry?.retention).toBeDefined();
      expect(logEntry?.retention.ttl).toBe(3600);
      expect(logEntry?.retention.maxEntries).toBe(10000);
      expect(logEntry?.retention.archiveAfter).toBe(259200);
      expect(logEntry?.retention.deleteAfter).toBe(2592000);
    });

    it('should support custom retention rule properties', () => {
      const transport = new ArrayTransport();
      const logger = createLogger({ name: 'test', transport });
      const rules: LogRetentionRules = {
        ttl: 3600,
        customRule: 'custom-value',
        customNumber: 42,
      };
      const retentionLogger = logger.withRetention(rules);

      retentionLogger.info('Test message');

      const logEntry = transport.getLastEntry();
      expect(logEntry?.retention.customRule).toBe('custom-value');
      expect(logEntry?.retention.customNumber).toBe(42);
    });

    it('should support string values for retention rules (policy codes)', () => {
      const transport = new ArrayTransport();
      const logger = createLogger({ name: 'test', transport });
      const rules: LogRetentionRules = {
        ttl: '30-days',
        policy: 'BANK-RET-2024-A',
        compliance: 'Basel-III',
        retentionPeriod: '7-years',
      };
      const retentionLogger = logger.withRetention(rules);

      retentionLogger.info('Test message');

      const logEntry = transport.getLastEntry();
      expect(logEntry?.retention.ttl).toBe('30-days');
      expect(logEntry?.retention.policy).toBe('BANK-RET-2024-A');
      expect(logEntry?.retention.compliance).toBe('Basel-III');
      expect(logEntry?.retention.retentionPeriod).toBe('7-years');
    });

    it('should support mixed numeric and string values', () => {
      const transport = new ArrayTransport();
      const logger = createLogger({ name: 'test', transport });
      const rules: LogRetentionRules = {
        ttl: 'HIPAA-compliant-7years',
        maxSize: 1024000000, // bytes
        encryption: 'AES-256',
        retentionPeriod: '7-years',
      };
      const retentionLogger = logger.withRetention(rules);

      retentionLogger.info('Test message');

      const logEntry = transport.getLastEntry();
      expect(logEntry?.retention.ttl).toBe('HIPAA-compliant-7years');
      expect(logEntry?.retention.maxSize).toBe(1024000000);
      expect(logEntry?.retention.encryption).toBe('AES-256');
      expect(logEntry?.retention.retentionPeriod).toBe('7-years');
    });

    it('should allow chaining with other fluent methods', () => {
      const logger = createLogger({ name: 'test' });
      const rules: LogRetentionRules = { ttl: 3600 };
      const chainedLogger = logger
        .withSource('api')
        .withTransactionId('tx-123')
        .withRetention(rules);

      expect(chainedLogger).not.toBe(logger);
    });
  });

  describe('Method Chaining', () => {
    it('should allow chaining all fluent methods together', () => {
      const transport = new ArrayTransport();
      const logger = createLogger({ name: 'test', transport });
      const rules: LogRetentionRules = {
        ttl: 7200,
        maxEntries: 5000,
      };

      const fullLogger = logger
        .withSource('payment-service')
        .withTransactionId('tx-payment-123')
        .withRetention(rules);

      fullLogger.info({ amount: 100.0 }, 'Payment processed');

      const logEntry = transport.getLastEntry();
      expect(logEntry?.source).toBe('payment-service');
      expect(logEntry?.transactionId).toBe('tx-payment-123');
      expect(logEntry?.retention).toBeDefined();
      expect(logEntry?.retention.ttl).toBe(7200);
      expect(logEntry?.amount).toBe(100.0);
      expect(logEntry?.message).toBe('Payment processed');
    });

    it('should preserve parent logger settings when chaining', () => {
      const parentLogger = createLogger({
        name: 'parent',
        level: 'debug',
      });

      const childLogger = parentLogger.withSource('child').withTransactionId('tx-1');

      expect(childLogger.name).toBe(parentLogger.name);
      expect(childLogger.level).toBe(parentLogger.level);
    });

    it('should handle multiple chained calls correctly', () => {
      const logger = createLogger({ name: 'test' });
      const logger1 = logger.withSource('api');
      const logger2 = logger1.withTransactionId('tx-1');
      const logger3 = logger2.withSource('redis'); // Override source

      expect(logger1).not.toBe(logger);
      expect(logger2).not.toBe(logger1);
      expect(logger3).not.toBe(logger2);
    });
  });

  describe('Immutable Behavior', () => {
    it('should not modify parent logger when using fluent methods', () => {
      const transport = new ArrayTransport();
      const parentLogger = createLogger({ name: 'parent', transport });
      const childLogger = parentLogger.withSource('child');

      // Log with parent - should NOT have source
      parentLogger.info('Parent log');
      // Log with child - should HAVE source
      childLogger.info('Child log');

      expect(transport.entries.length).toBe(2);
      const parentLog = transport.getParsedEntries()[0];
      const childLog = transport.getParsedEntries()[1];

      expect(parentLog.source).toBeUndefined();
      expect(childLog.source).toBe('child');
    });
  });
});

/**
 * Tests for Logger class
 * Tests follow SOLID, DDD, guard clauses, and functional programming patterns
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../src/Logger';
import { AsyncContext } from '../src/context/Context';
import type { LogLevel } from '../src/levels';
import { ArrayTransport } from '../src/transports/array';
import { JsonTransport } from '../src/transports/json';

describe('Logger', () => {
  describe('Constructor', () => {
    it('should create logger with default values', () => {
      const logger = new Logger('test');

      expect(logger.name).toBe('test');
      expect(logger.level).toBe('info');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger with custom level', () => {
      const logger = new Logger('test', new ArrayTransport(), 'debug');

      expect(logger.level).toBe('debug');
    });

    it('should create logger with bindings', () => {
      const logger = new Logger('test', new ArrayTransport(), 'info', { userId: 123 });

      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('Log Level Control', () => {
    it('should respect log level (debug)', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'debug');

      logger.trace('should not appear');
      logger.debug('should appear');
      logger.info('should appear');

      expect(transport.entries.length).toBe(2);
      const messages = transport.getParsedEntries().map((e) => e.message);
      expect(messages).toContain('should appear');
      expect(messages).not.toContain('should not appear');
    });

    it('should respect log level (info)', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info');

      logger.debug('should not appear');
      logger.info('should appear');
      logger.warn('should appear');

      expect(transport.entries.length).toBe(2);
    });

    it('should change log level dynamically', () => {
      const logger = new Logger('test', new ArrayTransport(), 'info');

      logger.setLevel('debug');
      expect(logger.level).toBe('debug');

      logger.setLevel('error');
      expect(logger.level).toBe('error');
    });
  });

  describe('Logging Methods', () => {
    it('should log with fatal level', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'trace');
      logger.fatal('fatal message');

      expect(transport.entries.length).toBe(1);
      const log = transport.getLastEntry();
      expect(log?.level).toBe('fatal');
      expect(log?.message).toBe('fatal message');
    });

    it('should log with error level', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'error');
      logger.error('error message');

      const log = transport.getLastEntry();
      expect(log?.level).toBe('error');
    });

    it('should log with warn level', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'warn');
      logger.warn('warn message');

      const log = transport.getLastEntry();
      expect(log?.level).toBe('warn');
    });

    it('should log with info level', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info');
      logger.info('info message');

      const log = transport.getLastEntry();
      expect(log?.level).toBe('info');
      expect(log?.message).toBe('info message');
    });

    it('should log with debug level', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'debug');
      logger.debug('debug message');

      const log = transport.getLastEntry();
      expect(log?.level).toBe('debug');
    });

    it('should log with trace level', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'trace');
      logger.trace('trace message');

      const log = transport.getLastEntry();
      expect(log?.level).toBe('trace');
    });
  });

  describe('Message Formatting', () => {
    it('should format message with util.format', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info');
      logger.info('User %s logged in', 'john');

      const log = transport.getLastEntry();
      expect(log?.message).toBe('User john logged in');
    });

    it('should handle metadata object pattern', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info');
      logger.info({ userId: 123 }, 'User logged in');

      const log = transport.getLastEntry();
      expect(log?.message).toBe('User logged in');
      expect(log?.userId).toBe(123);
    });

    it('should handle metadata with format arguments', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info');
      logger.info({ userId: 123 }, 'User %s logged in', 'john');

      const log = transport.getLastEntry();
      expect(log?.message).toBe('User john logged in');
      expect(log?.userId).toBe(123);
    });
  });

  describe('Bindings', () => {
    it('should include bindings in log output', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info', { app: 'myapp' });
      logger.info('message');

      const log = transport.getLastEntry();
      expect(log?.app).toBe('myapp');
    });

    it('should merge child bindings with parent', () => {
      const transport = new ArrayTransport();
      const parent = new Logger('test', transport, 'info', { parent: 'data' });
      const child = parent.child({ child: 'data' });
      child.info('message');

      const log = transport.getLastEntry();
      expect(log?.parent).toBe('data');
      expect(log?.child).toBe('data');
    });
  });

  describe('Async Context', () => {
    it('should include async context in logs', async () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info');

      await AsyncContext.runAsync(async () => {
        AsyncContext.set('correlationId', 'corr-123');
        AsyncContext.set('userId', 456);
        logger.info('message');
      });

      const log = transport.getLastEntry();
      expect(log?.correlationId).toBe('corr-123');
      expect(log?.userId).toBe(456);
    });

    it('should respect withoutContext() flag', async () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info').withoutContext();

      await AsyncContext.runAsync(async () => {
        AsyncContext.set('correlationId', 'corr-123');
        logger.info('message');
      });

      const log = transport.getLastEntry();
      expect(log?.correlationId).toBeUndefined();
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with additional bindings', () => {
      const parent = new Logger('test');
      const child = parent.child({ extra: 'data' });

      expect(child).not.toBe(parent);
      expect(child.name).toBe(parent.name);
      expect(child.level).toBe(parent.level);
    });

    it('should preserve parent level in child', () => {
      const parent = new Logger('test', new ArrayTransport(), 'debug');
      const child = parent.child({});

      expect(child.level).toBe('debug');
    });
  });

  describe('Flush and Close', () => {
    it('should flush transport if supported', async () => {
      const transport = new JsonTransport({ bufferSize: 1 });
      const flushSpy = vi.spyOn(transport, 'flush');

      const logger = new Logger('test', transport, 'info');
      await logger.flush();

      expect(flushSpy).toHaveBeenCalled();
    });

    it('should close transport if supported', async () => {
      const transport = new JsonTransport({ bufferSize: 1 });
      const closeSpy = vi.spyOn(transport, 'close');

      const logger = new Logger('test', transport, 'info');
      await logger.close();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should handle transport without flush', async () => {
      const mockTransport = {
        log: vi.fn(),
        level: 'trace' as const,
        name: 'mock',
        isLevelEnabled: () => true,
      };

      const logger = new Logger('test', mockTransport as any, 'info');
      await logger.flush(); // Should not throw
    });

    it('should handle transport without close', async () => {
      const mockTransport = {
        log: vi.fn(),
        level: 'trace' as const,
        name: 'mock',
        isLevelEnabled: () => true,
      };

      const logger = new Logger('test', mockTransport as any, 'info');
      await logger.close(); // Should not throw
    });
  });

  describe('Reconfigure', () => {
    it('should change log level at runtime', () => {
      const logger = new Logger('test', new ArrayTransport(), 'info');

      logger.reconfigure({ level: 'debug' });

      expect(logger.level).toBe('debug');
    });

    it('should change transport at runtime', () => {
      const oldTransport = new ArrayTransport();
      const newTransport = new ArrayTransport();
      const logger = new Logger('test', oldTransport, 'info');

      logger.reconfigure({ transport: newTransport });

      // Verify transport was switched by logging
      logger.info('test');
      expect(oldTransport.entries.length).toBe(0);
      expect(newTransport.entries.length).toBe(1);
    });

    it('should handle empty reconfigure options', () => {
      const logger = new Logger('test', new ArrayTransport(), 'info');
      const originalLevel = logger.level;

      logger.reconfigure({});

      expect(logger.level).toBe(originalLevel);
    });
  });

  describe('Fast Path Optimization', () => {
    it('should use fast path when no bindings, context, or metadata', () => {
      const transport = new ArrayTransport();
      const logger = new Logger('test', transport, 'info');
      logger.info('simple message');

      const log = transport.getLastEntry();
      expect(log?.timestamp).toBeDefined();
      expect(log?.level).toBe('info');
      expect(log?.message).toBe('simple message');
      expect(log?.service).toBe('test');
    });
  });
});

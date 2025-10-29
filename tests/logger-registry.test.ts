/**
 * Tests for LoggerRegistry
 * Tests for singleton registry pattern
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loggerRegistry as LoggerRegistry } from '../src/LoggerRegistry';

describe('LoggerRegistry', () => {
  beforeEach(() => {
    // Clear registry between tests
    LoggerRegistry.clear();
  });

  describe('getLogger', () => {
    it('should create and return logger if not exists', () => {
      const logger = LoggerRegistry.getLogger('test-logger');
      
      expect(logger).toBeDefined();
      expect(logger.name).toBe('test-logger');
    });

    it('should return cached logger if exists', () => {
      const logger1 = LoggerRegistry.getLogger('cached');
      const logger2 = LoggerRegistry.getLogger('cached');
      
      expect(logger1).toBe(logger2);
    });

    it('should create logger with custom options', () => {
      const logger = LoggerRegistry.getLogger('custom', {
        level: 'debug',
      });
      
      expect(logger.level).toBe('debug');
    });

    it('should use default level if not specified', () => {
      const logger = LoggerRegistry.getLogger('default');
      
      expect(logger.level).toBe('info');
    });
  });

  describe('hasLogger', () => {
    it('should return false for non-existent logger', () => {
      expect(LoggerRegistry.hasLogger('nonexistent')).toBe(false);
    });

    it('should return true for existing logger', () => {
      LoggerRegistry.getLogger('existing');
      expect(LoggerRegistry.hasLogger('existing')).toBe(true);
    });
  });

  describe('getLoggerNames', () => {
    it('should return empty array when no loggers', () => {
      expect(LoggerRegistry.getLoggerNames()).toEqual([]);
    });

    it('should return all logger names', () => {
      LoggerRegistry.getLogger('logger1');
      LoggerRegistry.getLogger('logger2');
      LoggerRegistry.getLogger('logger3');
      
      const names = LoggerRegistry.getLoggerNames();
      expect(names).toContain('logger1');
      expect(names).toContain('logger2');
      expect(names).toContain('logger3');
      expect(names.length).toBe(3);
    });
  });

  describe('removeLogger', () => {
    it('should remove logger from registry', () => {
      LoggerRegistry.getLogger('to-remove');
      expect(LoggerRegistry.hasLogger('to-remove')).toBe(true);
      
      LoggerRegistry.removeLogger('to-remove');
      expect(LoggerRegistry.hasLogger('to-remove')).toBe(false);
    });

    it('should not throw when removing non-existent logger', () => {
      expect(() => {
        LoggerRegistry.removeLogger('nonexistent');
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all loggers', () => {
      LoggerRegistry.getLogger('logger1');
      LoggerRegistry.getLogger('logger2');
      
      expect(LoggerRegistry.getLoggerNames().length).toBe(2);
      
      LoggerRegistry.clear();
      
      expect(LoggerRegistry.getLoggerNames().length).toBe(0);
    });
  });

  describe('getAllLoggers', () => {
    it('should return empty object when no loggers', () => {
      const all = LoggerRegistry.getAllLoggers();
      expect(Object.keys(all).length).toBe(0);
    });

    it('should return all registered loggers', () => {
      const logger1 = LoggerRegistry.getLogger('logger1');
      const logger2 = LoggerRegistry.getLogger('logger2');
      
      const all = LoggerRegistry.getAllLoggers();
      
      expect(all.logger1).toBe(logger1);
      expect(all.logger2).toBe(logger2);
      expect(Object.keys(all).length).toBe(2);
    });
  });

  describe('Multiple Instances', () => {
    it('should maintain separate loggers with same options', () => {
      const logger1 = LoggerRegistry.getLogger('same', { level: 'debug' });
      const logger2 = LoggerRegistry.getLogger('same', { level: 'debug' });
      
      expect(logger1).toBe(logger2);
      expect(logger1.level).toBe('debug');
    });

    it('should ignore options for existing logger', () => {
      const logger1 = LoggerRegistry.getLogger('existing', { level: 'debug' });
      const logger2 = LoggerRegistry.getLogger('existing', { level: 'error' });
      
      expect(logger1).toBe(logger2);
      expect(logger1.level).toBe('debug'); // First options should persist
    });
  });
});


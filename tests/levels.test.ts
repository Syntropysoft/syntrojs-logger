/**
 * Tests for log levels
 */

import { describe, expect, it } from 'vitest';
import { LOG_LEVEL_WEIGHTS, isLevelEnabled, logLevels } from '../src/levels';
import type { LogLevel } from '../src/levels';

describe('Log Levels', () => {
  describe('LOG_LEVEL_WEIGHTS', () => {
    it('should have correct weights', () => {
      expect(LOG_LEVEL_WEIGHTS.fatal).toBe(60);
      expect(LOG_LEVEL_WEIGHTS.error).toBe(50);
      expect(LOG_LEVEL_WEIGHTS.warn).toBe(40);
      expect(LOG_LEVEL_WEIGHTS.info).toBe(30);
      expect(LOG_LEVEL_WEIGHTS.debug).toBe(20);
      expect(LOG_LEVEL_WEIGHTS.trace).toBe(10);
      expect(LOG_LEVEL_WEIGHTS.silent).toBe(0);
    });
  });

  describe('isLevelEnabled', () => {
    it('should return false when configured level is silent', () => {
      expect(isLevelEnabled('info', 'silent')).toBe(false);
      expect(isLevelEnabled('error', 'silent')).toBe(false);
    });

    it('should return false when log level is silent', () => {
      expect(isLevelEnabled('silent', 'info')).toBe(false);
      expect(isLevelEnabled('silent', 'trace')).toBe(false);
    });

    it('should enable level when logLevel >= configuredLevel', () => {
      expect(isLevelEnabled('info', 'info')).toBe(true);
      expect(isLevelEnabled('error', 'info')).toBe(true);
      expect(isLevelEnabled('warn', 'info')).toBe(true);
    });

    it('should disable level when logLevel < configuredLevel', () => {
      expect(isLevelEnabled('debug', 'info')).toBe(false);
      expect(isLevelEnabled('trace', 'info')).toBe(false);
    });

    it('should handle all level combinations', () => {
      const levels: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

      levels.forEach((configured) => {
        levels.forEach((logLevel) => {
          const enabled = isLevelEnabled(logLevel, configured);
          const expected = LOG_LEVEL_WEIGHTS[logLevel] >= LOG_LEVEL_WEIGHTS[configured];
          expect(enabled).toBe(expected);
        });
      });
    });
  });

  describe('logLevels', () => {
    it('should contain all levels', () => {
      expect(logLevels).toContain('fatal');
      expect(logLevels).toContain('error');
      expect(logLevels).toContain('warn');
      expect(logLevels).toContain('info');
      expect(logLevels).toContain('debug');
      expect(logLevels).toContain('trace');
      expect(logLevels).toContain('silent');
    });
  });
});

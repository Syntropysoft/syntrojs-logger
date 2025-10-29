/**
 * Tests for LoggingMatrix (FieldFilter)
 * Tests for field filtering based on log level
 */

import { describe, it, expect } from 'vitest';
import { FieldFilter } from '../src/compliance/LoggingMatrix';
import type { LoggingMatrix } from '../src/compliance/LoggingMatrix';

describe('FieldFilter', () => {
  describe('Constructor', () => {
    it('should create filter with matrix', () => {
      const matrix: LoggingMatrix = {
        default: ['correlationId'],
        info: ['correlationId', 'userId'],
      };
      
      const filter = new FieldFilter(matrix);
      
      expect(filter).toBeInstanceOf(FieldFilter);
    });

    it('should handle empty matrix', () => {
      const matrix: LoggingMatrix = {};
      const filter = new FieldFilter(matrix);
      
      expect(filter).toBeInstanceOf(FieldFilter);
    });
  });

  describe('Field Filtering', () => {
    it('should filter context based on log level (default)', () => {
      const matrix: LoggingMatrix = {
        default: ['correlationId', 'requestId'],
      };
      
      const filter = new FieldFilter(matrix);
      
      const context = {
        correlationId: 'corr-123',
        requestId: 'req-456',
        secret: 'should-be-hidden',
        userId: 123,
      };
      
      const filtered = filter.filterContext(context, 'info');
      
      expect(filtered.correlationId).toBe('corr-123');
      expect(filtered.requestId).toBe('req-456');
      expect(filtered.secret).toBeUndefined();
      expect(filtered.userId).toBeUndefined();
    });

    it('should filter context based on specific log level', () => {
      const matrix: LoggingMatrix = {
        default: ['correlationId'],
        info: ['correlationId', 'userId'],
        error: ['correlationId', 'userId', 'errorCode'],
      };
      
      const filter = new FieldFilter(matrix);
      
      const context = {
        correlationId: 'corr-123',
        userId: 456,
        errorCode: 'E500',
        secret: 'hidden',
      };
      
      const infoFiltered = filter.filterContext(context, 'info');
      expect(infoFiltered.correlationId).toBe('corr-123');
      expect(infoFiltered.userId).toBe(456);
      expect(infoFiltered.errorCode).toBeUndefined();
      expect(infoFiltered.secret).toBeUndefined();
      
      const errorFiltered = filter.filterContext(context, 'error');
      expect(errorFiltered.correlationId).toBe('corr-123');
      expect(errorFiltered.userId).toBe(456);
      expect(errorFiltered.errorCode).toBe('E500');
      expect(errorFiltered.secret).toBeUndefined();
    });

    it('should fallback to default when level not found', () => {
      const matrix: LoggingMatrix = {
        default: ['correlationId'],
        info: ['correlationId', 'userId'],
      };
      
      const filter = new FieldFilter(matrix);
      
      const context = {
        correlationId: 'corr-123',
        userId: 456,
      };
      
      const filtered = filter.filterContext(context, 'debug');
      
      expect(filtered.correlationId).toBe('corr-123');
      expect(filtered.userId).toBeUndefined();
    });

    it('should handle wildcard (*) to show all fields', () => {
      const matrix: LoggingMatrix = {
        error: ['*'],
      };
      
      const filter = new FieldFilter(matrix);
      
      const context = {
        correlationId: 'corr-123',
        userId: 456,
        secret: 'visible-in-error',
      };
      
      const filtered = filter.filterContext(context, 'error');
      
      expect(filtered.correlationId).toBe('corr-123');
      expect(filtered.userId).toBe(456);
      expect(filtered.secret).toBe('visible-in-error');
    });
  });

  describe('Reconfigure', () => {
    it('should update matrix configuration', () => {
      const initialMatrix: LoggingMatrix = {
        default: ['correlationId'],
      };
      
      const filter = new FieldFilter(initialMatrix);
      
      const newMatrix: LoggingMatrix = {
        default: ['correlationId', 'userId'],
        info: ['correlationId'],
      };
      
      filter.reconfigure(newMatrix);
      
      const context = {
        correlationId: 'corr-123',
        userId: 456,
      };
      
      const filtered = filter.filterContext(context, 'default');
      expect(filtered.correlationId).toBe('corr-123');
      expect(filtered.userId).toBe(456);
    });

    it('should merge with existing matrix', () => {
      const initialMatrix: LoggingMatrix = {
        default: ['correlationId'],
        info: ['correlationId', 'userId'],
      };
      
      const filter = new FieldFilter(initialMatrix);
      
      const updateMatrix: LoggingMatrix = {
        error: ['correlationId', 'errorCode'],
      };
      
      filter.reconfigure(updateMatrix);
      
      // Should preserve existing levels
      const infoContext = { correlationId: 'corr-123', userId: 456 };
      const infoFiltered = filter.filterContext(infoContext, 'info');
      expect(infoFiltered.correlationId).toBe('corr-123');
      expect(infoFiltered.userId).toBe(456);
      
      // Should add new level
      const errorContext = { correlationId: 'corr-123', errorCode: 'E500' };
      const errorFiltered = filter.filterContext(errorContext, 'error');
      expect(errorFiltered.correlationId).toBe('corr-123');
      expect(errorFiltered.errorCode).toBe('E500');
    });
  });

  describe('Get Matrix', () => {
    it('should return current matrix configuration', () => {
      const matrix: LoggingMatrix = {
        default: ['correlationId'],
        info: ['correlationId', 'userId'],
      };
      
      const filter = new FieldFilter(matrix);
      const returned = filter.getMatrix();
      
      expect(returned.default).toEqual(['correlationId']);
      expect(returned.info).toEqual(['correlationId', 'userId']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context', () => {
      const matrix: LoggingMatrix = {
        default: ['correlationId'],
      };
      
      const filter = new FieldFilter(matrix);
      const filtered = filter.filterContext({}, 'info');
      
      expect(Object.keys(filtered).length).toBe(0);
    });

    it('should handle undefined values in context', () => {
      const matrix: LoggingMatrix = {
        default: ['correlationId', 'userId'],
      };
      
      const filter = new FieldFilter(matrix);
      const filtered = filter.filterContext({
        correlationId: undefined,
        userId: 123,
      }, 'info');
      
      expect(filtered.correlationId).toBeUndefined();
      expect(filtered.userId).toBe(123);
    });

    it('should handle matrix with empty arrays', () => {
      const matrix: LoggingMatrix = {
        default: [],
        info: ['correlationId'],
      };
      
      const filter = new FieldFilter(matrix);
      
      const context = {
        correlationId: 'corr-123',
        userId: 456,
      };
      
      const defaultFiltered = filter.filterContext(context, 'default');
      expect(Object.keys(defaultFiltered).length).toBe(0);
      
      const infoFiltered = filter.filterContext(context, 'info');
      expect(infoFiltered.correlationId).toBe('corr-123');
    });
  });
});


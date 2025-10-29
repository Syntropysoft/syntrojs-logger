/**
 * Tests for Transport edge cases to improve coverage
 */

import { describe, it, expect, vi } from 'vitest';
import { Logger } from '../src/Logger';
import { JsonTransport } from '../src/transports/json';
import { PrettyTransport } from '../src/transports/pretty';
import { CompactTransport } from '../src/transports/compact';
import { ClassicTransport } from '../src/transports/classic';
import { ArrayTransport } from '../src/transports/array';
import { createLogger } from '../src/index';

describe('Transport Edge Cases', () => {
  describe('ParseEntry Failures', () => {
    it('should handle parseEntry failure in PrettyTransport', () => {
      const transport = new PrettyTransport({ level: 'trace' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      transport.log('invalid-json-{');
      
      expect(logSpy).toHaveBeenCalled();
      
      logSpy.mockRestore();
    });

    it('should handle parseEntry failure in CompactTransport', () => {
      const transport = new CompactTransport({ level: 'trace' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      transport.log('invalid-json-{');
      
      expect(logSpy).toHaveBeenCalled();
      
      logSpy.mockRestore();
    });

    it('should handle parseEntry failure in ClassicTransport', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const transport = new ClassicTransport({ level: 'trace' });
      
      transport.log('invalid-json-{');
      
      expect(logSpy).toHaveBeenCalled();
      
      logSpy.mockRestore();
    });
  });

  describe('Level Filtering', () => {
    it('should not log when level is below transport level', () => {
      const transport = new ArrayTransport({ level: 'info' });
      
      transport.log(JSON.stringify({
        timestamp: Date.now(),
        level: 'debug',
        message: 'should not appear',
        service: 'test',
      }));
      
      expect(transport.entries.length).toBe(0);
    });

    it('should log when level matches transport level', () => {
      const transport = new ArrayTransport({ level: 'info' });
      
      transport.log(JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'should appear',
        service: 'test',
      }));
      
      expect(transport.entries.length).toBe(1);
    });
  });

  describe('Missing Fields', () => {
    it('should handle log entry without service field', () => {
      const transport = new ArrayTransport();
      
      // Directly test transport with entry without service
      transport.log(JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test',
      }));
      
      // Should not throw and should log
      expect(transport.entries.length).toBeGreaterThan(0);
      const log = transport.getLastEntry();
      expect(log?.message).toBe('test');
    });

    it('should handle log entry without timestamp', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const transport = new ClassicTransport({ level: 'trace' });
      
      transport.log(JSON.stringify({
        level: 'info',
        message: 'test',
        service: 'test',
      }));
      
      // Should handle gracefully with fallback to current time
      expect(logSpy).toHaveBeenCalled();
      const callArgs = String(logSpy.mock.calls[0]?.[0]);
      expect(callArgs).toContain('['); // Should have timestamp brackets
      
      logSpy.mockRestore();
    });
  });

  describe('JsonTransport Buffering', () => {
    it('should buffer entries and flush when full', async () => {
      const transport = new JsonTransport({ bufferSize: 3 });
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      
      transport.log('entry1');
      transport.log('entry2');
      
      // Should not write yet
      expect(writeSpy).not.toHaveBeenCalled();
      
      transport.log('entry3');
      
      // Should write after buffer is full
      expect(writeSpy).toHaveBeenCalled();
      
      await transport.close();
      writeSpy.mockRestore();
    });

    it('should handle flush with empty buffer', async () => {
      const transport = new JsonTransport({ bufferSize: 10 });
      await transport.flush(); // Should not throw
      await transport.close(); // Should not throw
    });
  });

  describe('CompactTransport Metadata', () => {
    it('should handle metadata with objects', () => {
      const transport = new CompactTransport({ level: 'trace' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const json = JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test',
        service: 'test',
        metadata: { nested: { value: 'test' } },
      });
      
      transport.log(json);
      
      expect(logSpy).toHaveBeenCalled();
      const callArgs = String(logSpy.mock.calls[0]?.[0]);
      expect(callArgs).toContain('metadata');
      
      logSpy.mockRestore();
    });

    it('should handle empty metadata', () => {
      const transport = new CompactTransport({ level: 'trace' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const json = JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test',
        service: 'test',
      });
      
      transport.log(json);
      
      expect(logSpy).toHaveBeenCalled();
      
      logSpy.mockRestore();
    });
  });

  describe('PrettyTransport Edge Cases', () => {
    it('should handle log entry without service', () => {
      const transport = new PrettyTransport({ level: 'trace' });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const json = JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test',
      });
      
      transport.log(json);
      
      expect(logSpy).toHaveBeenCalled();
      
      logSpy.mockRestore();
    });
  });

  describe('createLogger Transport Selection', () => {
    it('should fallback to json for unknown transport string', () => {
      const logger = createLogger({
        transport: 'unknown' as any,
      });
      
      expect(logger).toBeInstanceOf(Logger);
      // Should still work
      logger.info('test');
    });
  });
});


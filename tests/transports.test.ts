/**
 * Tests for Transport implementations
 * Tests for json, pretty, compact, classic, and composite transports
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompositeTransport } from '../src/transports/CompositeTransport';
import { ClassicTransport } from '../src/transports/classic';
import { CompactTransport } from '../src/transports/compact';
import { JsonTransport } from '../src/transports/json';
import { PrettyTransport } from '../src/transports/pretty';
import type { LogEntry } from '../src/types';

describe('Transports', () => {
  describe('JsonTransport', () => {
    it('should log JSON string entries', () => {
      const transport = new JsonTransport({ bufferSize: 1 });
      const writeSpy = vi.spyOn(process.stdout, 'write');

      transport.log('{"level":"info","message":"test"}');

      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
    });

    it('should buffer multiple entries', async () => {
      const transport = new JsonTransport({ bufferSize: 3 });
      const writeSpy = vi.spyOn(process.stdout, 'write');

      transport.log('entry1');
      transport.log('entry2');

      // Should not write yet (buffer not full)
      expect(writeSpy).not.toHaveBeenCalled();

      transport.log('entry3');

      // Should write after buffer is full
      expect(writeSpy).toHaveBeenCalled();

      await transport.close();
      writeSpy.mockRestore();
    });

    it('should flush buffer on close', async () => {
      const transport = new JsonTransport({ bufferSize: 10 });
      const writeSpy = vi.spyOn(process.stdout, 'write');

      transport.log('entry1');
      transport.log('entry2');

      await transport.close();

      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
    });

    it('should handle string entries', () => {
      const transport = new JsonTransport({ bufferSize: 1 });
      const writeSpy = vi.spyOn(process.stdout, 'write');

      transport.log('{"test":"value"}');

      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
    });

    it('should handle LogEntry objects', () => {
      const transport = new JsonTransport({ bufferSize: 1 });
      const writeSpy = vi.spyOn(process.stdout, 'write');

      const entry: LogEntry = {
        timestamp: Date.now(),
        level: 'info',
        message: 'test',
        service: 'test-service',
      };

      transport.log(entry);

      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
    });
  });

  describe('PrettyTransport', () => {
    it('should parse and format JSON entries', () => {
      const transport = new PrettyTransport();
      const logSpy = vi.spyOn(console, 'log');

      const json = JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test message',
        service: 'test-service',
      });

      transport.log(json);

      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('should format timestamp with brackets', () => {
      const transport = new PrettyTransport();
      const logSpy = vi.spyOn(console, 'log');

      const json = JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test',
        service: 'test',
      });

      transport.log(json);

      const callArgs = logSpy.mock.calls[0][0];
      expect(String(callArgs)).toContain('[');
      expect(String(callArgs)).toContain(']');

      logSpy.mockRestore();
    });
  });

  describe('CompactTransport', () => {
    it('should format logs in compact single-line format', () => {
      const transport = new CompactTransport();
      const logSpy = vi.spyOn(console, 'log');

      const json = JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test message',
        service: 'test-service',
      });

      transport.log(json);

      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('should include timestamp with brackets', () => {
      const transport = new CompactTransport();
      const logSpy = vi.spyOn(console, 'log');

      const json = JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test',
        service: 'test',
      });

      transport.log(json);

      const callArgs = logSpy.mock.calls[0][0];
      expect(String(callArgs)).toContain('[');

      logSpy.mockRestore();
    });
  });

  describe('ClassicTransport', () => {
    it('should format logs in Log4j-style format', () => {
      // Create spy before transport to ensure it captures calls
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const transport = new ClassicTransport({ level: 'trace' }); // Trace level to accept all logs

      const json = JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test message',
        service: 'test-service',
      });

      transport.log(json);

      expect(logSpy).toHaveBeenCalled();
      const callArgs = logSpy.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      expect(String(callArgs)).toContain('INFO');
      expect(String(callArgs)).toContain('test message');

      logSpy.mockRestore();
    });

    it('should use correct console method for each level', () => {
      const levels = [
        { level: 'trace', method: 'log' as const },
        { level: 'debug', method: 'log' as const },
        { level: 'info', method: 'log' as const },
        { level: 'warn', method: 'warn' as const },
        { level: 'error', method: 'error' as const },
        { level: 'fatal', method: 'error' as const },
      ];

      levels.forEach(({ level, method }) => {
        // Create spy BEFORE transport so it captures the console method reference
        const spy = vi.spyOn(console, method).mockImplementation(() => {});
        const transport = new ClassicTransport({ level: 'trace' });

        const json = JSON.stringify({
          timestamp: Date.now(),
          level,
          message: 'test',
          service: 'test',
        });

        transport.log(json);

        expect(spy).toHaveBeenCalledTimes(1);

        spy.mockRestore();
      });
    });

    it('should format timestamp with brackets', () => {
      // Create spy before transport to ensure it captures calls
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const transport = new ClassicTransport({ level: 'trace' }); // Trace level to accept all logs

      const json = JSON.stringify({
        timestamp: Date.now(),
        level: 'info',
        message: 'test',
        service: 'test',
      });

      transport.log(json);

      expect(logSpy).toHaveBeenCalledTimes(1);
      const callArgs = logSpy.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      expect(String(callArgs)).toContain('[');
      expect(String(callArgs)).toContain(']');

      logSpy.mockRestore();
    });
  });

  describe('CompositeTransport', () => {
    it('should forward logs to all transports', () => {
      const transport1 = new JsonTransport({ bufferSize: 1 });
      const transport2 = new PrettyTransport();

      const spy1 = vi.spyOn(transport1, 'log');
      const spy2 = vi.spyOn(transport2, 'log');

      const composite = new CompositeTransport([transport1, transport2]);

      const json = '{"level":"info","message":"test"}';
      composite.log(json);

      expect(spy1).toHaveBeenCalledWith(json);
      expect(spy2).toHaveBeenCalledWith(json);
    });

    it('should handle empty transport array', () => {
      const composite = new CompositeTransport([]);

      expect(() => {
        composite.log('{"level":"info","message":"test"}');
      }).not.toThrow();
    });

    it('should flush all transports', async () => {
      const transport1 = new JsonTransport({ bufferSize: 10 });
      const transport2 = new JsonTransport({ bufferSize: 10 });

      const spy1 = vi.spyOn(transport1, 'flush');
      const spy2 = vi.spyOn(transport2, 'flush');

      const composite = new CompositeTransport([transport1, transport2]);

      await composite.flush();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('should close all transports', async () => {
      const transport1 = new JsonTransport({ bufferSize: 1 });
      const transport2 = new JsonTransport({ bufferSize: 1 });

      const spy1 = vi.spyOn(transport1, 'close');
      const spy2 = vi.spyOn(transport2, 'close');

      const composite = new CompositeTransport([transport1, transport2]);

      await composite.close();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });
  });
});

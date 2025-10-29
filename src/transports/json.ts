/**
 * JSON Transport - Outputs logs in structured JSON format
 * Perfect for production and log aggregation systems
 * 
 * Optimized for raw JSON output without complex serialization overhead
 * * NOTE: Uses process.stdout.write() for maximum performance, which is synchronous
 * and avoids console.log's internal overhead.
 */

import type { LogEntry } from '../types';
import { Transport, type TransportOptions } from './Transport';

export interface JsonTransportOptions extends TransportOptions {
  bufferSize?: number; // Number of logs to buffer before flushing
}

export class JsonTransport extends Transport {
  private buffer: string[] = [];
  private bufferSize: number;

  constructor(options?: JsonTransportOptions) {
    super(options);
    this.bufferSize = options?.bufferSize ?? 100; // Default: buffer 100 logs
  }

  log(entry: LogEntry | string): void {
    // Logger already builds the JSON string for us - just output it
    // This is the fastest path: no object creation, no JSON.stringify()
    let json: string;
    if (typeof entry === 'string') {
      json = entry;
    } else {
      // Fallback for custom transports that still pass objects
      json = JSON.stringify(entry);
    }

    // If no buffering (bufferSize=1), write immediately
    if (this.bufferSize === 1) {
      // Direct synchronous write for max speed
      process.stdout.write(json + '\n');
      return;
    }

    // Add to buffer
    this.buffer.push(json);

    // Flush if buffer is full (immediate flush for capacity)
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;
    
    // Write all buffered logs at once (batched for better I/O performance)
    // NOTE: Using process.stdout.write() for Pino-like performance
    process.stdout.write(this.buffer.join('\n') + '\n');
    this.buffer = [];
  }

  override close(): void {
    // Flush any remaining logs before closing
    this.flush();
  }
}

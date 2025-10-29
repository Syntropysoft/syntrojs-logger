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
    
    // Guard clause: Convert entry to JSON string (functional approach)
    const json = typeof entry === 'string' 
      ? entry 
      : JSON.stringify(entry); // Fallback for custom transports

    // Guard clause: No buffering (fast path)
    if (this.bufferSize === 1) {
      process.stdout.write(json + '\n');
      return;
    }

    // Add to buffer
    this.buffer.push(json);

    // Guard clause: Buffer full - flush immediately
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

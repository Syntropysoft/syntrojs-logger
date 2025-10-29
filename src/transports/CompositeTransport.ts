/**
 * Composite Transport - Send logs to multiple transports simultaneously
 * 
 * Useful for logging to console AND file AND OpenTelemetry at the same time
 */

import type { Transport } from './Transport';
import type { LogEntry } from '../types';
import { Transport as BaseTransport } from './Transport';

export class CompositeTransport extends BaseTransport {
  private transports: Transport[];

  constructor(transports: Transport[]) {
    super({ level: 'trace' }); // Accept all levels
    this.transports = transports;
  }

  log(entry: LogEntry): void {
    // Send to all transports (Silent Observer pattern)
    this.transports.forEach(transport => {
      try {
        transport.log(entry);
      } catch (error) {
        // One transport failure shouldn't affect others
        // Silent Observer: we observe and report, but never interrupt
        console.error('[Transport Error] Failed to write to transport:', error);
      }
    });
  }

  async flush(): Promise<void> {
    await Promise.allSettled(
      this.transports.map(t => t.flush?.() || Promise.resolve())
    );
  }

  async close(): Promise<void> {
    await Promise.allSettled(
      this.transports.map(t => t.close?.() || Promise.resolve())
    );
  }
}


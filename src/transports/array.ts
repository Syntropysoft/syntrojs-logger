/**
 * Array Transport - For testing purposes
 * 
 * Writes log entries to an array instead of console/stdout.
 * Perfect for tests as it's fast and allows easy inspection of logs.
 */

import type { LogEntry } from '../types';
import { Transport, type TransportOptions } from './Transport';

export class ArrayTransport extends Transport {
  /** Array to store log entries (functional: readonly from outside, mutable internally) */
  public readonly entries: string[] = [];

  constructor(options?: TransportOptions) {
    super(options);
  }

  /**
   * Log entry to array (Single Responsibility).
   * Functional approach: Single expression using ternary.
   */
  log(entry: LogEntry | string): void {
    // Guard clause: Check level filtering only if entry has valid log structure
    if (typeof entry === 'string') {
      try {
        const logEntry = JSON.parse(entry);
        // Only filter by level if it's a valid log entry with level field
        if (logEntry?.level && !this.isLevelEnabled(logEntry.level)) {
          return;
        }
      } catch {
        // If parsing fails, log anyway (let caller handle - edge case testing)
      }
    } else {
      // LogEntry object - check level
      if (!this.isLevelEnabled(entry.level)) {
        return;
      }
    }
    
    // Functional approach: Single expression using ternary
    const output = typeof entry === 'string' 
      ? entry 
      : JSON.stringify(entry);
    this.entries.push(output);
  }

  /**
   * Clear all entries (useful for test cleanup).
   * Functional approach: Mutates internal state (acceptable for test utility).
   */
  clear(): void {
    this.entries.length = 0;
  }

  /**
   * Get entries as parsed JSON objects (functional helper).
   * Guard clause: Returns empty array if no entries or parsing fails.
   */
  getParsedEntries<T = LogEntry>(): T[] {
    return this.entries
      .map(entry => {
        try {
          return JSON.parse(entry) as T;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is T => entry !== null);
  }

  /**
   * Get last entry as parsed JSON (functional helper).
   * Guard clause: Returns undefined if no entries or parsing fails.
   */
  getLastEntry<T = LogEntry>(): T | undefined {
    const lastEntry = this.entries[this.entries.length - 1];
    if (!lastEntry) return undefined;
    
    try {
      return JSON.parse(lastEntry) as T;
    } catch {
      return undefined;
    }
  }
}


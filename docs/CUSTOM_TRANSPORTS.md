# Custom Transports

How to create custom transports for different destinations (files, OpenTelemetry, HTTP, etc.)

## Architecture

All transports must implement the `Transport` interface:

```typescript
interface Transport {
  log(entry: LogEntry): void;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
}
```

## Example: File Transport

```typescript
import { createWriteStream, promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type { LogEntry, Transport } from '@syntrojs/logger';
import { Transport as BaseTransport } from '@syntrojs/logger';

export class FileTransport extends BaseTransport {
  private path: string;
  private stream?: NodeJS.WritableStream;

  constructor(path: string) {
    super();
    this.path = path;
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.stream) {
      await fs.mkdir(dirname(this.path), { recursive: true });
      this.stream = createWriteStream(this.path, { flags: 'a' });
    }
    
    this.stream.write(JSON.stringify(entry) + '\n');
  }

  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.stream?.end(resolve);
    });
  }
}

// Usage
const logger = createLogger({
  transport: new FileTransport('./logs/app.log')
});
```

## Example: OpenTelemetry Transport

```typescript
import type { LogEntry, Transport } from '@syntrojs/logger';
import { Transport as BaseTransport } from '@syntrojs/logger';
import { logs } from '@opentelemetry/api-logs';

export class OpenTelemetryTransport extends BaseTransport {
  private readonly logger;

  constructor() {
    super();
    const loggerProvider = logs.getLoggerProvider();
    this.logger = loggerProvider.getLogger('my-app', '1.0.0');
  }

  log(entry: LogEntry): void {
    const { timestamp, level, message, service, ...attributes } = entry;

    // Map syntrojs levels to OTel severity
    const severityMap = {
      trace: 1, debug: 5, info: 9, 
      warn: 13, error: 17, fatal: 21
    };

    this.logger.emit({
      timestamp: new Date(timestamp).getTime(),
      severityNumber: severityMap[level] || 0,
      severityText: level.toUpperCase(),
      body: message,
      attributes: { ...attributes, 'service.name': service },
    });
  }
}

// Usage (requires: npm install @opentelemetry/api)
const logger = createLogger({
  transport: new OpenTelemetryTransport()
});
```

## Example: HTTP/Webhook Transport

```typescript
import type { LogEntry, Transport } from '@syntrojs/logger';
import { Transport as BaseTransport } from '@syntrojs/logger';

export class WebhookTransport extends BaseTransport {
  private url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  async log(entry: LogEntry): Promise<void> {
    // Fire and forget
    fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {
      // Silently fail - don't interrupt application
    });
  }
}
```

## Example: Multiple Transports (Composite)

```typescript
import type { Transport, LogEntry } from '@syntrojs/logger';

export class CompositeTransport implements Transport {
  constructor(private transports: Transport[]) {}

  log(entry: LogEntry): void {
    // Send to all transports
    this.transports.forEach(t => {
      try {
        t.log(entry);
      } catch (error) {
        // One transport failure shouldn't affect others
        console.error('Transport error:', error);
      }
    });
  }

  async flush(): Promise<void> {
    await Promise.all(
      this.transports.map(t => t.flush?.() || Promise.resolve())
    );
  }

  async close(): Promise<void> {
    await Promise.all(
      this.transports.map(t => t.close?.() || Promise.resolve())
    );
  }
}

// Usage: Log to console AND file AND OTel
const logger = createLogger({
  transport: new CompositeTransport([
    new PrettyTransport(),
    new FileTransport('./logs/app.log'),
    new OpenTelemetryTransport(),
  ])
});
```

## Best Practices

1. **Don't block**: Make async operations non-blocking
2. **Fail silently**: Transport errors shouldn't crash the app
3. **Implement flush**: Allow graceful shutdown
4. **Implement close**: Clean up resources
5. **Extend BaseTransport**: Get level filtering for free

## Included Transports

- `PrettyTransport` - Colored console output
- `CompactTransport` - Single-line format
- `ClassicTransport` - Log4j-style
- `JsonTransport` - Structured JSON


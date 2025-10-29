<p align="center">
  <img src="https://raw.githubusercontent.com/Syntropysoft/sintrojs/main/assets/beaconLog-2.png" alt="SyntroJS Logger Logo" width="170"/>
  <h1 align="center">@syntrojs/logger 🔥</h1>
  <p align="center"><b>Fast, simple, developer-friendly logger for Node.js & Bun</b></p>
  <p align="center">⚡ <b>~75% of Pino's performance</b> | 🎨 <b>4 beautiful transports</b></p>
</p>

[![npm version](https://img.shields.io/npm/v/@syntrojs/logger.svg)](https://www.npmjs.com/package/@syntrojs/logger)
[![🚀 DUAL RUNTIME](https://img.shields.io/badge/🚀-DUAL%20RUNTIME-red.svg)](https://github.com/Syntropysoft/sintrojs-logger)

---

## ⚠️ ALPHA VERSION

**🚨 This is an ALPHA version and proof of concept. Do not use in production!**

- ✅ **Core functionality works** - All transports, child loggers, and async context
- ⚠️ **API may change** - Breaking changes expected in future versions
- ⚠️ **Not production-ready** - Missing tests, CI/CD, and stability improvements

---

## 🚀 Quick Start

### 1. Install Logger

```bash
npm install @syntrojs/logger@alpha
# or
pnpm add @syntrojs/logger@alpha
```

### 2. Your First Logger (2 Lines!)

```typescript
import { createLogger } from '@syntrojs/logger';

const logger = createLogger({ name: 'my-app' });
logger.info('Hello, world!');
```

**That's it!** 🎉 You now have:
- ✅ ISO timestamps
- ✅ Structured logging
- ✅ Multiple transports (JSON, Pretty, Compact, Classic)
- ✅ High performance

### 3. Use in Production

```typescript
const logger = createLogger({
  name: 'my-api',
  level: 'info',
  transport: 'json' // Machine-readable JSON
});

logger.info({ method: 'GET', path: '/users' }, 'Request received');
// Output: {"time":"2025-01-01T12:00:00.000Z","level":"info","message":"Request received","service":"my-api","method":"GET","path":"/users"}
```

### 4. Use in Development

```typescript
const logger = createLogger({
  name: 'dev-server',
  level: 'debug',
  transport: 'pretty' // Beautiful colored output
});

logger.info({ userId: 123, action: 'login' }, 'User logged in');
```

**Output:**
```
[2025-01-01T12:00:00.000Z] [INFO] (dev-server): User logged in
{
  "userId": 123,
  "action": "login"
}
```

---

## 🎯 What is @syntrojs/logger?

**Fast, simple, developer-friendly logger** with beautiful output and blazing performance.

**🔥 Works Standalone:**
```bash
# Use in ANY Node.js or Bun project
import { createLogger } from '@syntrojs/logger';
```

**🤝 Integrates with SyntroJS:**
```bash
# Automatically configured with correlation IDs and context
import { createLogger } from 'syntrojs/logger';
```

**Zero dependencies** (except strace for colors) - **Maximum performance** - **Beautiful output**

---

## 📦 Features

- ⚡ **Blazing fast** - Optimized for performance (~75% of Pino's speed, 1M+ ops/sec)
- 🎨 **Beautiful output** - Four transport options: JSON, Pretty, Compact, and Classic
- 🔧 **Type-safe** - Full TypeScript support
- 🪶 **Lightweight** - Minimal dependencies (chalk for colors only)
- 🎯 **Simple API** - Inspired by Pino, even more lightweight
- 🌟 **Flexible** - Child loggers, custom transports (OpenTelemetry, files, HTTP, etc.)
- ⚙️ **Production-ready** - JSON logging with ISO timestamps, buffering, and zero overhead

## Installation

```bash
npm install @syntrojs/logger@alpha
```

## Usage

### Standalone (Any Node.js/Bun Project)

Use `@syntrojs/logger` in **any project** - it's completely independent:

```typescript
import { createLogger } from '@syntrojs/logger';

const logger = createLogger({ name: 'my-app' });
logger.info('Hello, world!');
```

### With SyntroJS

When used with [SyntroJS](https://github.com/Syntropysoft/sintrojs), the logger is automatically configured with request context, correlation IDs, and structured logging.

## Quick Start

### Requirements

- **Node.js**: >= 18.0.0
- **Bun**: >= 1.0.0 (AsyncContext feature has partial support)

### Basic Usage

```typescript
import { createLogger } from '@syntrojs/logger';

const logger = createLogger({ name: 'my-app' });

logger.info('Hello, world!');
logger.error('Something went wrong', { error: new Error('test') });
logger.debug({ userId: 123 }, 'User logged in');
```

### Production (JSON format)

```typescript
import { createLogger } from '@syntrojs/logger';

const logger = createLogger({
  name: 'my-api',
  level: 'info',
  transport: 'json'
});

logger.info({ method: 'GET', path: '/users' }, 'Request received');
// Output: {"time":"2025-01-01T12:00:00.000Z","level":"info","message":"Request received","service":"my-api","method":"GET","path":"/users"}
```

> **Performance**: Uses ISO timestamps for clarity and compatibility. Works seamlessly with all log aggregation systems.

### Development (Pretty colors)

```typescript
import { createLogger } from '@syntrojs/logger';

const logger = createLogger({
  name: 'dev',
  level: 'debug',
  transport: 'pretty' // default
});

logger.info({ userId: 123, action: 'login' }, 'User logged in');
```

**Output:**
```
[2025-01-01T12:00:00.000Z] [INFO] (dev-server): User logged in
{
  "userId": 123,
  "action": "login"
}
```

### Compact Format

```typescript
import { createLogger } from '@syntrojs/logger';

const logger = createLogger({
  name: 'api',
  level: 'info',
  transport: 'compact'
});

logger.info('Request processed', { statusCode: 200, latency: 45 });
```

**Output:**
```
[2025-01-01T12:00:00.000Z] [INFO] (ci-pipeline): Request processed | statusCode=200 latency=45
```

### Classic Style (Log4j-style)

```typescript
import { createLogger } from '@syntrojs/logger';

const logger = createLogger({
  name: 'api',
  level: 'info',
  transport: 'classic'
});

logger.error('Database connection failed', { host: 'localhost', port: 5432 });
```

**Output:**
```
[2025-01-01T12:00:00.000Z] ERROR [api] - Database connection failed [host="localhost" port=5432]
```

### Child Loggers

```typescript
const logger = createLogger({ name: 'app' });
const dbLogger = logger.child({ module: 'database' });
const apiLogger = logger.child({ module: 'api' });

dbLogger.info('Connected to database'); // includes module: 'database'
apiLogger.info('API started'); // includes module: 'api'
```

### With Source

```typescript
const logger = createLogger({ name: 'app' });
const userLogger = logger.withSource('UserService');

userLogger.info('User created'); // includes source: 'UserService'
```

## API

### `createLogger(options)`

Creates a new logger instance.

**Options:**
- `name` (string): Logger name/service identifier
- `level` (LogLevel): Minimum log level ('trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent')
- `transport` ('pretty' | 'json' | 'compact' | 'classic' | Transport): Output format

### Logger Methods

- `logger.trace(...args)` - Trace level logs
- `logger.debug(...args)` - Debug level logs
- `logger.info(...args)` - Info level logs
- `logger.warn(...args)` - Warning logs
- `logger.error(...args)` - Error logs
- `logger.fatal(...args)` - Fatal error logs
- `logger.setLevel(level)` - Change log level dynamically
- `logger.child(bindings)` - Create child logger with bindings
- `logger.withSource(source)` - Create logger with source binding

### Log Format

You can log in two ways:

```typescript
// Simple message
logger.info('User logged in');

// Message with metadata
logger.info({ userId: 123 }, 'User logged in');

// Formatted message
logger.info('User %s logged in', 'John');

// All together
logger.info({ userId: 123 }, 'User %s logged in', 'John');
```

## Transport Options

Choose the transport format that best fits your needs:

| Transport | Use Case | Format |
|-----------|----------|--------|
| `'json'` | Production, Log aggregation | ISO timestamp JSON |
| `'pretty'` | Development, Debugging | Colored with ISO timestamps |
| `'compact'` | Terminals, CI/CD | Single-line ISO format |
| `'classic'` | Traditional apps | ISO timestamp Log4j-style |

### Multiple Outputs (Composite Transport)

Send logs to multiple destinations simultaneously:

```typescript
import { createLogger } from '@syntrojs/logger';
import { JsonTransport, PrettyTransport, ClassicTransport, CompositeTransport } from '@syntrojs/logger';

const logger = createLogger({
  name: 'my-app',
  transport: new CompositeTransport([
    new JsonTransport(),  // To file / aggregation
    new PrettyTransport()  // To console (dev)
  ])
});

logger.info('This appears in both JSON and pretty format');
```

## Custom Transports

Extend the `Transport` class to send logs anywhere. Here are practical examples:

### File Transport Example

```typescript
import { Transport, type LogEntry } from '@syntrojs/logger';
import * as fs from 'node:fs';

class FileTransport extends Transport {
  private logFile: string;

  constructor(options?: { filename?: string }) {
    super();
    this.logFile = options?.filename || './logs/app.log';
  }

  log(entry: LogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFile, line);
  }
}

const logger = createLogger({
  name: 'my-app',
  transport: new FileTransport({ filename: './logs/app.jsonl' })
});
```

### HTTP Webhook Example

```typescript
class WebhookTransport extends Transport {
  private url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  log(entry: LogEntry): void {
    // Send to webhook (don't await to avoid blocking)
    fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }).catch(err => console.error('Failed to send log:', err));
  }
}

const logger = createLogger({
  transport: new WebhookTransport('https://logs.example.com/webhook')
});
```

### Multiple Destinations

```typescript
const logger = createLogger({
  name: 'my-app',
  transport: new CompositeTransport([
    new JsonTransport(),           // Console (JSON)
    new FileTransport(),            // File
    new WebhookTransport(url)      // External service
  ])
});
```

See [CUSTOM_TRANSPORTS.md](./CUSTOM_TRANSPORTS.md) for more examples including OpenTelemetry, databases, and message queues.

## License

Apache-2.0


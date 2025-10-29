# @syntrojs/logger

🔥 Fast, simple, and developer-friendly logger for Node.js and Bun

## Features

- ⚡ **Blazing fast** - Minimal overhead, optimized for performance
- 🎨 **Beautiful output** - Four transport options: JSON, Pretty, Compact, and Classic
- 🔧 **Type-safe** - Full TypeScript support
- 🪶 **Lightweight** - Single dependency (chalk for colors only)
- 🎯 **Simple API** - Inspired by Pino, even more lightweight
- 🌟 **Flexible** - Child loggers, custom transports (OpenTelemetry, files, HTTP, etc.)

## Installation

```bash
npm install @syntrojs/logger
```

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
// Output: {"timestamp":"2024-01-01T12:00:00.000Z","level":"info","message":"Request received","service":"my-api","method":"GET","path":"/users"}
```

### Development (Pretty colors)

```typescript
import { createLogger } from '@syntrojs/logger';

const logger = createLogger({
  name: 'dev',
  level: 'debug',
  transport: 'pretty' // default
});
```

### Classic Style (Log4j-style)

```typescript
import { createLogger } from '@syntrojs/logger';

const logger = createLogger({
  name: 'api',
  level: 'info',
  transport: 'classic' // Traditional single-line format
});
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

## Custom Transports

Extend the `Transport` class to send logs anywhere (files, OpenTelemetry, HTTP, etc.):

```typescript
import { Transport, type LogEntry } from '@syntrojs/logger';

class FileTransport extends Transport {
  log(entry: LogEntry): void {
    // Write to file
    fs.appendFile('./logs/app.log', JSON.stringify(entry));
  }
}

const logger = createLogger({
  transport: new FileTransport()
});
```

See [CUSTOM_TRANSPORTS.md](./CUSTOM_TRANSPORTS.md) for complete examples including OpenTelemetry, HTTP webhooks, and composite transports.

## License

Apache-2.0


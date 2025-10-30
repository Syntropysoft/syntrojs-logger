<p align="center">
  <img src="https://raw.githubusercontent.com/Syntropysoft/syntrojs-logger/refs/heads/main/assets/beaconLog-2.png" alt="SyntroJS Logger Logo" width="170"/>
  <h1 align="center">@syntrojs/logger</h1>
  <p align="center"><b>Fast, simple, developer-friendly logger for Node.js & Bun</b></p>
  <p align="center">⚡ <b>~75% of Pino's performance</b> | 🎨 <b>4 beautiful transports</b></p>
</p>

[![npm version](https://img.shields.io/npm/v/@syntrojs/logger.svg)](https://www.npmjs.com/package/@syntrojs/logger)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/Syntropysoft/sintrojs-logger/blob/main/LICENSE)
[![🚀 DUAL RUNTIME](https://img.shields.io/badge/🚀-DUAL%20RUNTIME-red.svg)](https://github.com/Syntropysoft/sintrojs-logger)

**Quality & Security:**

[![CI](https://img.shields.io/badge/CI-passing-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/badge/CodeQL-enabled-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger/actions/workflows/codeql.yml)
[![Mutation Testing](https://img.shields.io/badge/Mutation%20Testing-enabled-orange.svg)](https://github.com/Syntropysoft/sintrojs-logger/actions/workflows/mutation-testing.yml)
[![Security](https://img.shields.io/badge/security-0%20vulnerabilities-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger/security)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger)

**Code Coverage:**

[![Coverage](https://img.shields.io/badge/coverage-93.05%25-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger)
[![Mutation Score](https://img.shields.io/badge/mutation%20score-54.47%25-orange.svg)](https://github.com/Syntropysoft/sintrojs-logger)

--- 

## ⚠️ ALPHA VERSION

**🚨 This is an ALPHA version and proof of concept. Do not use in production!**

- ✅ **Core functionality works** - All transports, child loggers, and async context.
- ✅ **Well tested** - 93.05% code coverage, 54.47% mutation score.
- ⚠️ **API may change** - Breaking changes are expected.
- ⚠️ **Not production-ready** - Missing CI/CD and stability improvements.

--- 

## 🎯 What is @syntrojs/logger?

**@syntrojs/logger** is a fast, simple, and developer-friendly logger for Node.js and Bun. It's designed for high performance and flexibility, offering beautiful, structured output with minimal configuration.

It works as a standalone library in any project or integrates seamlessly with the **[SyntroJS framework](https://github.com/Syntropysoft/sintrojs)** for automatic request correlation.

--- 

## ✨ Core Features

- ⚡ **Blazing Fast**: Optimized for performance (~75% of Pino's speed).
- 🎨 **Beautiful & Flexible Output**: Four built-in transports (JSON, Pretty, Compact, Classic).
- 🔧 **Type-Safe**: Full TypeScript support out of the box.
- 🪶 **Lightweight**: Minimal dependencies (only `chalk` for colors).
- 🎯 **Simple & Fluent API**: Chain methods to add rich, structured context to your logs.
- 🗂️ **Compliance & Business Ready**: Attach deeply nested metadata for compliance (GDPR, HIPAA, PCI), business analytics, or internal workflows.
- 🚀 **Dual Runtime**: Works on both **Node.js** and **Bun**.

--- 

## 🚀 Quick Start

### 1. Installation

```bash
npm install @syntrojs/logger@alpha
# or
pnpm add @syntrojs/logger@alpha
```

### 2. Basic Usage

Create a logger and start logging. It's that simple.

```typescript
import { createLogger } from '@syntrojs/logger';

// Create a new logger instance
const logger = createLogger({ name: 'my-app' });

logger.info('Hello, world!');
logger.info({ userId: 123 }, 'User logged in');
```

For a shared, singleton instance across your application, use `getLogger`:

```typescript
import { getLogger } from '@syntrojs/logger/registry';

// Gets or creates a shared logger for 'my-app'
const logger = getLogger('my-app');
logger.info('This message comes from a shared logger instance.');
```

### 3. Transports for Development vs. Production

Switch between human-readable logs in development and machine-readable JSON in production with a single option.

**Development (`pretty`):**
Beautiful, colored output is the default.

```typescript
const devLogger = createLogger({ name: 'dev-server', level: 'debug' });
devLogger.info({ userId: 123 }, 'User logged in');
```
**Output:**
```
[2025-01-01T12:00:00.000Z] [INFO] (dev-server): User logged in
{
  "userId": 123
}
```

**Production (`json`):**
Structured JSON is essential for log aggregation systems.

```typescript
const prodLogger = createLogger({ name: 'my-api', transport: 'json' });
prodLogger.info({ method: 'GET', path: '/users' }, 'Request received');
```
**Output:**
```json
{"time":"2025-01-01T12:00:00.000Z","level":"info","message":"Request received","service":"my-api","method":"GET","path":"/users"}
```

--- 

## 🛠️ Advanced Usage: The Fluent API for Rich Context

Add contextual data to your logs easily by chaining methods.

### Child Loggers & Basic Context

Create specialized loggers that automatically include context like a module name, source, or a transaction ID for distributed tracing.

```typescript
const logger = createLogger({ name: 'app' });

// Create a child logger with a 'module' binding
const dbLogger = logger.child({ module: 'database' });
dbLogger.info('Connected to database'); // Log includes "module": "database"

// Chain methods to add a source and transaction ID
const requestLogger = logger
  .withSource('payment-api')
  .withTransactionId('tx-payment-123');
  
requestLogger.info('Processing payment'); // Log includes source and transactionId
```

### The Power of `withRetention()`: Compliance & Business Metadata

The `.withRetention()` method is the library's superpower. It allows you to attach **any deeply nested JSON object** to your logs. This is perfect for satisfying complex requirements for compliance, business analytics, and operations.

**Why is this critical?**
- **Compliance**: Embed data for GDPR, HIPAA, PCI-DSS, etc., to track retention policies, audit trails, and data processing rules.
- **Business**: Track marketing campaigns, user segments, product tiers, and other business-critical information.
- **Operations**: Include team ownership, monitoring metrics, workflow stages, and alert configurations.

#### Example: Enterprise-Grade Logging

Here’s a logger configured for a payment service, embedding rich metadata for compliance, business, and internal monitoring.

```typescript
import { createLogger } from '@syntrojs/logger';

const enterpriseLogger = createLogger({ name: 'payment-service' })
  .withRetention({
    // 1. Compliance Metadata (for auditors and legal)
    compliance: {
      regulations: {
        pci: {
          version: '3.2.1',
          level: 1,
          requirements: { encryption: 'AES-256', audit: { enabled: true, retention: '5-years' } }
        },
        gdpr: {
          articles: [6, 7, 32],
          dataProcessing: { legalBasis: 'contract', consent: 'explicit' }
        }
      }
    },
    // 2. Business Context (for analytics and product teams)
    business: {
      product: { id: 'payment-gateway', tier: 'enterprise' },
      vendor: { primary: 'stripe', backup: 'paypal' }
    },
    // 3. Operational Data (for engineering and SREs)
    internal: {
      team: { name: 'payments-engineering' },
      monitoring: { metrics: ['transaction-volume', 'error-rate', 'latency-p95'] }
    }
  });

// All logs from this logger will automatically include the full nested metadata
enterpriseLogger
  .withTransactionId('tx-payment-12345')
  .info({ amount: 299.99, currency: 'USD' }, 'Payment processed');
```
The resulting JSON log contains the `info` message and payload, plus the entire `retention` object with all its nested compliance, business, and internal data.

### Managing Multiple Configurations with a Registry

For complex applications, you can define several logger configurations in a central registry and retrieve them on demand.

```typescript
import { createLogger } from '@syntrojs/logger';

const loggerRegistry = {
  'simple': createLogger({ name: 'simple-app' }),
  'analytics': createLogger({ name: 'analytics-service' }).withRetention({
    compliance: { privacy: { gdpr: { anonymization: 'required' } } },
    business: { campaigns: { active: [{ id: 'summer-2024' }] } }
  }),
  'enterprise': enterpriseLogger // from the example above
};

function getLogger(name: 'simple' | 'analytics' | 'enterprise') {
  return loggerRegistry[name];
}

// Use loggers on-demand
getLogger('simple').info('User logged in');
getLogger('analytics').info({ event: 'purchase' }, 'Analytics event tracked');
getLogger('enterprise').withTransactionId('tx-abc').info('Enterprise log');
```

--- 

## 🎨 Transports

### Other Built-in Transports

Besides `pretty` and `json`, the logger includes:
- **`compact`**: A single-line format perfect for CI/CD pipelines.
- **`classic`**: A traditional Log4j-style format.

```typescript
const logger = createLogger({ transport: 'compact' });
logger.info('Request processed', { statusCode: 200, latency: 45 });
// Output: [2025-01-01T12:00:00.000Z] [INFO] (ci-pipeline): Request processed | statusCode=200 latency=45
```

### Composite Transport: Multiple Outputs

Send logs to multiple destinations at once, such as the console during development and a file for persistence.

```typescript
import { createLogger, JsonTransport, PrettyTransport, CompositeTransport } from '@syntrojs/logger';

const logger = createLogger({
  name: 'my-app',
  transport: new CompositeTransport([
    new JsonTransport(),  // For log aggregation
    new PrettyTransport() // For the developer console
  ])
});

logger.info('This appears in both JSON and pretty format');
```

### Custom Transports

You can easily create your own transport to send logs anywhere (e.g., a file, a webhook, or a monitoring service).

```typescript
import { Transport, type LogEntry } from '@syntrojs/logger';
import * as fs from 'node:fs';

class FileTransport extends Transport {
  private logFile: string = './logs/app.log';

  log(entry: LogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFile, line);
  }
}

const logger = createLogger({
  name: 'my-app',
  transport: new FileTransport()
});

logger.info('This log will be written to ./logs/app.log');
```

--- 

## 📖 API Reference

### Logger Creation
- **`createLogger(options)`**: Creates a new, independent logger instance.
- **`getLogger(name, options?)`**: Retrieves or creates a shared, singleton logger instance from a global registry.

### Logger Options
- `name` (string): Service/application identifier.
- `level` (string): Minimum log level to output (`trace`, `debug`, `info`, `warn`, `error`, `fatal`, `silent`). Default: `info`.
- `transport` (string | Transport): Output format (`pretty`, `json`, `compact`, `classic`) or a custom transport instance. Default: `pretty`.

### Logger Methods
- `logger.info(obj?, msg?, ...args)`: Logs an informational message.
- `logger.debug(...)`, `logger.warn(...)`, `logger.error(...)`, etc.
- `logger.child(bindings)`: Creates a new logger that inherits from the parent and includes the provided `bindings` object in all its logs.
- `logger.withSource(source)`: Returns a new logger instance with a `source` field.
- `logger.withTransactionId(id)`: Returns a new logger instance with a `transactionId` field.
- `logger.withRetention(rules)`: Returns a new logger instance with a `retention` field containing the provided metadata object.

--- 

## 📄 License

Apache 2.0 - See [LICENSE](./LICENSE) for details.
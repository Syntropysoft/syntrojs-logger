<p align="center">
  <img src="https://raw.githubusercontent.com/Syntropysoft/sintrojs-logger/main/assets/syntropylog-logo.png" alt="SyntroJS Logger Logo" width="170"/>
  <h1 align="center">@syntrojs/logger 🔥</h1>
  <p align="center"><b>Fast, simple, developer-friendly logger for Node.js & Bun</b></p>
  <p align="center">⚡ <b>~75% of Pino's performance</b> | 🎨 <b>4 beautiful transports</b></p>
</p>

[![npm version](https://img.shields.io/npm/v/@syntrojs/logger.svg)](https://www.npmjs.com/package/@syntrojs/logger)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/Syntropysoft/sintrojs-logger/blob/main/LICENSE)
[![🚀 DUAL RUNTIME](https://img.shields.io/badge/🚀-DUAL%20RUNTIME-red.svg)](https://github.com/Syntropysoft/sintrojs-logger)

**Quality & Security:**

[![CI](https://github.com/Syntropysoft/sintrojs-logger/workflows/CI/badge.svg)](https://github.com/Syntropysoft/sintrojs-logger/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Syntropysoft/sintrojs-logger/workflows/CodeQL/badge.svg)](https://github.com/Syntropysoft/sintrojs-logger/actions/workflows/codeql.yml)
[![Mutation Testing](https://github.com/Syntropysoft/sintrojs-logger/workflows/Mutation%20Testing/badge.svg)](https://github.com/Syntropysoft/sintrojs-logger/actions/workflows/mutation-testing.yml)
[![Security](https://img.shields.io/badge/security-0%20vulnerabilities-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger/security)

**Code Coverage:**

[![Coverage](https://img.shields.io/badge/coverage-93.05%25-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger)
[![Mutation Score](https://img.shields.io/badge/mutation%20score-54.47%25-orange.svg)](https://github.com/Syntropysoft/sintrojs-logger)
[![Statements](https://img.shields.io/badge/statements-93.05%25-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger)
[![Branches](https://img.shields.io/badge/branches-84.61%25-yellow.svg)](https://github.com/Syntropysoft/sintrojs-logger)
[![Functions](https://img.shields.io/badge/functions-91.72%25-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger)
[![Lines](https://img.shields.io/badge/lines-93.05%25-brightgreen.svg)](https://github.com/Syntropysoft/sintrojs-logger)

---

## ⚠️ ALPHA VERSION

**🚨 This is an ALPHA version and proof of concept. Do not use in production!**

- ✅ **Core functionality works** - All transports, child loggers, and async context
- ✅ **Well tested** - 93.05% code coverage, 54.47% mutation score
- ⚠️ **API may change** - Breaking changes expected in future versions
- ⚠️ **Not production-ready** - Missing CI/CD and stability improvements

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

**Zero dependencies** (except chalk for colors) - **Maximum performance** - **Beautiful output**

---

## 💎 Ultimate Flexibility - Simple to Complex

**@syntrojs/logger** adapts to ANY use case. Start simple, grow as needed. Create multiple loggers with different complexity levels:

### Example 1: Simple Logger - Basic Logging

Perfect for small projects or getting started:

```typescript
// Simple logger - two lines!
const logger = createLogger({ name: 'my-app' });
logger.info('Hello, world!');
```

### Example 2: Medium Logger - Classic Compliance Rules

Add compliance metadata for regulations like GDPR, HIPAA, or PCI-DSS:

```typescript
// Logger with compliance retention rules
const complianceLogger = createLogger({ name: 'payment-api' })
  .withRetention({
    policy: 'PCI-DSS-LEVEL-1',
    retentionPeriod: '5-years',
    encryption: 'AES-256',
    auditRequired: true,
    compliance: 'PCI-DSS'
  });

complianceLogger.info({ amount: 299.99 }, 'Payment processed');
// Output includes: "retention": { "policy": "PCI-DSS-LEVEL-1", "retentionPeriod": "5-years", ... }
```

### Example 3: Complex Logger - Enterprise Metadata

Full compliance with nested regulations, business context, and operational metadata:

```typescript
// Complex logger with deeply nested compliance and business metadata
const enterpriseLogger = createLogger({ name: 'payment-service' })
  .withRetention({
    // Compliance - nested regulations structure
    compliance: {
      regulations: {
        pci: {
          version: '3.2.1',
          level: 1,
          requirements: {
            encryption: 'AES-256',
            tokenization: 'required',
            audit: {
              enabled: true,
              retention: '5-years',
              alerts: ['fraud-detection', 'unauthorized-access']
            }
          }
        },
        gdpr: {
          articles: [6, 7, 32],
          dataProcessing: {
            legalBasis: 'contract',
            consent: 'explicit',
            rightToErasure: true
          }
        },
        hipaa: {
          sections: ['164.312', '164.314'],
          accessControls: {
            authentication: 'mfa-required',
            authorization: 'role-based'
          }
        }
      }
    },
    // Business context
    business: {
      product: {
        id: 'payment-gateway',
        tier: 'enterprise',
        pricing: { model: 'transaction-based' }
      },
      vendor: {
        primary: 'stripe',
        backup: 'paypal'
      }
    },
    // Operational metadata
    internal: {
      team: { name: 'payments-engineering' },
      monitoring: {
        metrics: ['transaction-volume', 'error-rate', 'latency-p95']
      }
    }
  });

enterpriseLogger
  .withTransactionId('tx-payment-12345')
  .info({ amount: 299.99, currency: 'USD' }, 'Payment processed');
// Output includes ALL nested metadata: compliance.regulations, business, internal, transactionId, etc.
```

### Multiple Loggers - Registry Pattern

Create several loggers with different complexity levels, use on-demand:

```typescript
// Registry: Create multiple loggers with different configurations
const loggerRegistry: Record<string, ReturnType<typeof createLogger>> = {};

// 1. Simple logger - basic logging
loggerRegistry['simple'] = createLogger({ name: 'simple-app' });

// 2. Medium logger - with classic compliance
loggerRegistry['compliance'] = createLogger({ name: 'payment-api' })
  .withRetention({
    policy: 'PCI-DSS-LEVEL-1',
    retentionPeriod: '5-years',
    compliance: 'PCI-DSS'
  });

// 3. Complex logger - full enterprise metadata
loggerRegistry['enterprise'] = createLogger({ name: 'payment-service' })
  .withRetention({
    compliance: {
      regulations: {
        pci: {
          version: '3.2.1',
          requirements: {
            encryption: 'AES-256',
            audit: { enabled: true, retention: '5-years' }
          }
        },
        gdpr: {
          articles: [6, 7, 32],
          dataProcessing: { legalBasis: 'contract', consent: 'explicit' }
        }
      }
    },
    business: {
      product: { id: 'payment-gateway', tier: 'enterprise' },
      vendor: { primary: 'stripe', backup: 'paypal' }
    },
    internal: {
      team: { name: 'payments-engineering' },
      monitoring: { metrics: ['transaction-volume', 'error-rate'] }
    }
  });

// 4. Analytics logger - with campaigns and privacy compliance
loggerRegistry['analytics'] = createLogger({ name: 'analytics-service' })
  .withRetention({
    business: {
      campaigns: [{
        id: 'summer-2024',
        channels: ['email', 'push'],
        targeting: {
          segments: ['premium', 'active'],
          demographics: { age: [25, 45], location: 'US' }
        }
      }]
    },
    compliance: {
      privacy: {
        gdpr: { anonymization: 'required', consentTracking: true },
        ccpa: { doNotSell: 'respect', optOut: 'honored' }
      }
    }
  });

// Use loggers on-demand
function getLogger(name: string) {
  return loggerRegistry[name];
}

// Simple logging
getLogger('simple')?.info('User logged in');

// Compliance-aware logging
getLogger('compliance')
  ?.withTransactionId('tx-123')
  .info({ amount: 100.0 }, 'Payment processed');

// Enterprise logging with full context
getLogger('enterprise')
  ?.withTransactionId('tx-456')
  .withSource('payment-api')
  .info({ amount: 299.99 }, 'Payment processed');
// Automatically includes: compliance.regulations, business, internal, transactionId, source, etc.
```

**Why compliance metadata matters:**

Compliance rules (GDPR, HIPAA, PCI-DSS, SOX, etc.) are **critical information** for log analysis:

- **Retention policies**: How long logs must be kept (legal requirements)
- **Regulation tracking**: Which regulations apply to specific logs
- **Audit trails**: Proof of compliance for regulators
- **Data processing**: Legal basis, consent, and privacy requirements
- **Encryption standards**: Security requirements for sensitive data
- **Access controls**: Who can access logs and under what conditions

With **deeply nested JSON metadata**, you can:
- **Structure complex regulations**: Multiple regulations (PCI + GDPR + HIPAA) with nested requirements
- **Add business context**: Campaigns, products, workflows that need tracking
- **Track operations**: Team ownership, monitoring metrics, alert configurations
- **Enable automatic processing**: Log aggregation tools can parse structured metadata for compliance automation

**Benefits:**
- ✅ **Start simple** - Basic logging in 2 lines
- ✅ **Add compliance** - Classic retention rules when needed
- ✅ **Go enterprise** - Complex nested metadata for full context
- ✅ **Multiple loggers** - Different complexity levels per service/domain
- ✅ **Zero limits** - Any JSON structure, any depth, any fields
- ✅ **Type-safe** - Full TypeScript support with zero runtime overhead
- ✅ **On-demand access** - Retrieve pre-configured loggers anywhere

Perfect for: **Compliance** (GDPR, HIPAA, PCI-DSS, SOX) | **Business** (campaigns, analytics, products) | **Operations** (workflows, infrastructure, monitoring) | **Anything** your organization needs

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

### Fluent API

The logger provides a fluent API for contextual logging with method chaining:

#### With Source

Identify which module or component generated the log:

```typescript
const logger = createLogger({ name: 'app' });
const userLogger = logger.withSource('UserService');
const redisLogger = logger.withSource('redis');

userLogger.info('User created'); // includes source: 'UserService'
```

#### With Transaction ID

Track requests across multiple services in distributed systems:

```typescript
const logger = createLogger({ name: 'api' });
const txLogger = logger.withTransactionId('tx-abc-123');

txLogger.info({ userId: 123 }, 'Processing payment');
// Output includes: "transactionId": "tx-abc-123"
```

#### With Retention Rules

Attach any metadata to logs. **Completely flexible:** Any JSON object (nested at any depth) with any keys and any JSON-compatible values. Supports nested objects, arrays, and any combination. Use for:
- **Compliance:** retention policies, regulations, encryption requirements
- **Business:** campaign info, user segments, product IDs, marketing data
- **Internal processes:** workflow IDs, pipeline stages, job queues, department info
- **Anything else** your organization needs for log analysis

Each organization defines their own structure:

```typescript
import type { LogRetentionRules } from '@syntrojs/logger';

const logger = createLogger({ name: 'api' });

// Numeric values (seconds)
const rules: LogRetentionRules = {
  ttl: 3600,              // Time to live: 1 hour
  maxEntries: 10000,
  archiveAfter: 259200,   // Archive after 3 days
  deleteAfter: 2592000    // Delete after 30 days
};

// String values (policy codes) - for banking/healthcare compliance
const bankingRules: LogRetentionRules = {
  ttl: '30-days',
  policy: 'BANK-RET-2024-A',
  compliance: 'Basel-III'
};

// Nested metadata - multiple levels of organization
const nestedMetadata: LogRetentionRules = {
  // Compliance (nested)
  compliance: {
    policy: 'HIPAA-compliant-7years',
    retention: {
      period: '7-years',
      archive: {
        enabled: true,
        location: 's3://compliance-archive'
      }
    },
    encryption: {
      algorithm: 'AES-256',
      keyRotation: '30-days'
    }
  },
  
  // Business/campaign (nested)
  business: {
    campaign: {
      id: 'summer-2024',
      channel: 'email-marketing',
      target: {
        audience: 'millennials',
        demographics: { age: [25, 40], location: 'US' }
      }
    },
    product: {
      id: 'prod-xyz',
      category: 'fintech'
    }
  },
  
  // Internal processes (nested)
  internal: {
    workflow: {
      id: 'wf-payment-processing',
      department: 'finance',
      pipeline: {
        stage: 'validation',
        queue: 'high-priority'
      }
    }
  },
  
  // Arrays
  tags: ['payment', 'compliance', 'pci-dss'],
  policies: [
    { name: 'GDPR', version: '2024.1' },
    { name: 'CCPA', version: '2023.2' }
  ]
};

const metadataLogger = logger.withRetention(nestedMetadata);

metadataLogger.info({ action: 'payment' }, 'Payment processed');
// Output includes full nested structure: "retention": { "compliance": { ... }, "business": { ... }, ... }
```

#### Method Chaining

Chain multiple fluent methods together:

```typescript
const logger = createLogger({ name: 'payment-service' });

const requestLogger = logger
  .withSource('payment-api')
  .withTransactionId('tx-payment-123')
  .withRetention({
    campaign: {
      id: 'summer-2024',
      channel: 'email'
    },
    workflow: {
      id: 'wf-payment',
      department: 'fintech'
    },
    compliance: {
      standard: 'PCI-DSS',
      level: 1,
      requirements: {
        encryption: 'AES-256',
        audit: true
      }
    }
  });

requestLogger.info({ amount: 100.0 }, 'Payment processed');
// Output includes: source, transactionId, retention (with full nested structure), and amount
```

#### Logger Registry Pattern - Multiple Loggers with Complex Metadata

Create multiple loggers with different complex metadata configurations, then retrieve and use them on-demand. Each logger maintains its own context with deeply nested metadata for compliance, business rules, internal processes, and more:

```typescript
import { createLogger, type LogRetentionRules } from '@syntrojs/logger';

// Registry pattern: Store multiple loggers with complex metadata
const loggerRegistry: Record<string, ReturnType<typeof createLogger>> = {};

// 1. Payment Service Logger - with compliance, business, and monitoring metadata
loggerRegistry['payment-service'] = createLogger({ name: 'payment-service' })
  .withRetention({
    compliance: {
      regulations: {
        pci: {
          version: '3.2.1',
          requirements: {
            encryption: 'AES-256',
            tokenization: 'required',
            audit: {
              enabled: true,
              retention: '5-years',
              alerts: ['fraud-detection', 'unauthorized-access']
            }
          }
        }
      }
    },
    business: {
      product: {
        id: 'payment-gateway',
        tier: 'enterprise',
        pricing: {
          model: 'transaction-based',
          rates: {
            card: { percentage: 2.9, fixed: 0.30 }
          }
        }
      },
      vendor: {
        primary: 'stripe',
        settings: {
          webhookUrl: 'https://api.example.com/webhooks/payments',
          retryPolicy: { maxAttempts: 3, backoff: 'exponential' }
        }
      }
    },
    internal: {
      team: {
        name: 'payments-engineering',
        onCall: { schedule: 'rotation', escalation: ['slack', 'pagerduty'] }
      },
      monitoring: {
        metrics: ['transaction-volume', 'error-rate', 'latency-p95'],
        alerts: {
          errorRate: { threshold: 0.05, severity: 'critical' }
        }
      }
    }
  });

// 2. Analytics Service Logger - with campaigns and privacy metadata
loggerRegistry['analytics-service'] = createLogger({ name: 'analytics-service' })
  .withRetention({
    business: {
      campaigns: {
        active: [{
          id: 'summer-2024',
          channels: ['email', 'push', 'in-app'],
          targeting: {
            segments: ['premium', 'active'],
            demographics: { age: [25, 45], location: 'US' }
          },
          budgets: { daily: 1000, total: 50000 }
        }]
      },
      analytics: {
        tracking: {
          events: ['page-view', 'click', 'conversion'],
          properties: {
            userId: 'hashed',
            ipAddress: 'anonymized'
          }
        }
      }
    },
    compliance: {
      privacy: {
        gdpr: { anonymization: 'required', consentTracking: true },
        ccpa: { doNotSell: 'respect', optOut: 'honored' }
      }
    }
  });

// Usage: Retrieve and use loggers on-demand
function getLogger(name: string) {
  return loggerRegistry[name];
}

// Use payment logger
getLogger('payment-service')
  ?.withTransactionId('tx-payment-12345')
  .info({ amount: 299.99, currency: 'USD' }, 'Payment processed');

// Use analytics logger
getLogger('analytics-service')
  ?.withTransactionId('tx-analytics-abc')
  .info({ 
    event: 'purchase-completed',
    userId: 789,
    revenue: 299.99
  }, 'Analytics event tracked');
```

**Benefits:**
- **Centralized Configuration**: Define complex metadata once per service/domain
- **On-Demand Access**: Retrieve pre-configured loggers anywhere in your application
- **Rich Context**: Each log automatically includes all relevant compliance, business, and operational metadata
- **Type Safety**: TypeScript ensures correct logger usage and metadata structure

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
- `logger.withTransactionId(transactionId)` - Create logger with transaction ID for distributed tracing
- `logger.withRetention(rules)` - Create logger with any metadata (compliance, campaigns, internal processes, etc.)

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


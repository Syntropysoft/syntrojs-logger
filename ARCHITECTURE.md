# syntrojs-logger Architecture

## Philosophy: Separation of Concerns

**syntrojs-logger** is a focused, ultra-fast logger that extracts the most important parts from syntropyLog while maintaining simplicity and performance.

## What We Extracted from syntropyLog

### ✅ Core Logger (Included)
- **Fast, structured logging** with minimal overhead
- **Multiple transports** (Pretty, JSON, Compact, Classic)
- **Child loggers** for modular logging
- **Custom transports** for extensibility

### ✅ Correlation ID Management (Included)
- **AsyncContext** for automatic context propagation
- **Auto-generation** of correlation IDs with UUID
- **Configurable header names** (x-correlation-id, etc.)
- **AsyncLocalStorage** based (same as Fastify, syntropyLog)

### ❌ Resource Management (Excluded - Planned Separately)
- Redis connection pooling → **Separate package**: `@syntrojs/redis`
- HTTP client instrumentation → **Separate package**: `@syntrojs/instrumentation`
- Message broker integration → **Separate package**: `@syntrojs/brokers`
- Masking engine → **Separate package**: `@syntrojs/masking`
- Serialization pipeline → **Separate package**: `@syntrojs/serialization`

## Package Structure (Planned)

```
@syntrojs/logger          ← THIS PACKAGE (logging only)
  ├─ Logger with transports
  ├─ AsyncContext for correlation IDs
  └─ Global logger registry

@syntrojs/redis           ← Future (optional)
  ├─ Redis connection management
  ├─ Correlation ID propagation
  └─ Singleton pattern for resources

@syntrojs/instrumentation ← Future (optional)  
  ├─ HTTP client wrapping
  ├─ Automatic correlation ID injection
  └─ Request/response logging

@syntrojs/masking         ← Future (optional)
  ├─ Data masking engine
  ├─ PII detection
  └─ GDPR compliance

@syntrojs/serialization   ← Future (optional)
  ├─ Complex object serialization
  ├─ Circular reference handling
  └─ Error serialization
```

## Why This Approach?

### 1. **Single Responsibility**
- Logger does logging only
- No mandatory dependencies
- Fast and lightweight

### 2. **Optional Features**
- Users add what they need
- No bloat for simple apps
- Progressive enhancement

### 3. **Framework Agnostic**
- Works with Express, Fastify, Elysia, Bun
- No framework lock-in
- Independent library

### 4. **Learning from syntropyLog**
- syntropyLog = everything integrated (enterprise-ready but complex)
- syntrojs-logger = focused core (simple and fast)
- Add complexity only when needed

## Performance Goals

Target: **Same or faster than Pino**
- Minimal overhead
- Zero dependencies (except chalk for colors)
- Fast JSON serialization
- Efficient async context propagation

## Migration Path

### Simple App (Start Here)
```typescript
import { createLogger } from '@syntrojs/logger';
const logger = createLogger();
```

### Add Correlation IDs
```typescript
import { AsyncContext, getLogger } from '@syntrojs/logger';
// Add context propagation
```

### Add Redis (When Needed)
```typescript
import { Redis } from '@syntrojs/redis';
// Add Redis support
```

### Add Instrumentation (When Needed)
```typescript
import { HttpClient } from '@syntrojs/instrumentation';
// Add HTTP instrumentation
```

This way, apps only include what they need! 🚀


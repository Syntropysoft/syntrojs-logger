# Logger Comparison: Correlation ID Support

## Native Correlation ID Support

| Logger | Auto-Generate | Configurable Header | Built-in Context | Async Propagation |
|--------|---------------|---------------------|------------------|-------------------|
| **syntropyLog** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **syntrojs-logger** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Pino | ❌ No | ❌ No | ❌ No* | ❌ Manual |
| Winston | ❌ No | ❌ No | ❌ No | ❌ Manual |
| Bunyan | ❌ No | ❌ No | ❌ No | ❌ Manual |
| Log4j/Java | ❌ No | ❌ No | ❌ No* | ❌ Manual |
| Serilog/.NET | ❌ No | ❌ No | ❌ No* | ❌ Manual |

*Can integrate with OpenTelemetry for trace IDs but requires additional setup

## Manual Implementation Required

### Pino
```javascript
// Requires manual child logger with correlation ID
const logger = pino().child({ correlationId: 'req-123' });
logger.info('Request processed');

// No built-in auto-generation
// No async context propagation
```

### Winston
```javascript
// Requires custom format or metadata
logger.info('Request processed', { correlationId: 'req-123' });

// No built-in auto-generation
// No async context propagation
// Must pass correlation ID manually to every log
```

### Bunyan
```javascript
// Requires child logger
const logger = bunyan.createLogger({ name: 'app' }).child({ correlationId: 'req-123' });

// No built-in auto-generation  
// No async context propagation
```

## With syntrojs-logger

```typescript
// Auto-configured correlation ID
import { AsyncContext, getLogger } from '@syntrojs/logger';

AsyncContext.configure({
  correlationIdKey: 'x-correlation-id',
  autoGenerate: true
});

// In your request handler
await AsyncContext.runAsync(async () => {
  AsyncContext.setCorrelationId(req.headers['x-correlation-id']);
  
  const logger = getLogger('api');
  logger.info('Request processed'); // Correlation ID automatically included!
  
  await callDatabase(); // Correlation ID propagates automatically
  await callExternalAPI(); // Correlation ID propagates automatically
});
```

## Key Advantages

✅ **Zero Boilerplate** - No need to pass correlation ID manually  
✅ **Auto-Propagation** - Works across async boundaries  
✅ **Auto-Generation** - Creates UUID if not present  
✅ **Configurable** - Custom header names supported  
✅ **Framework Agnostic** - Works with Express, Fastify, Elysia, etc.

## Industry Standard

Most loggers require:
- Manual correlation ID passing
- Custom middleware implementation
- Manual async context management
- No auto-generation
- Framework-specific setup

**syntrojs-logger** provides this out-of-the-box, similar to syntropyLog!


/**
 * Complete examples of all available transports
 * 
 * Run with: bun examples/transports.example.ts
 * Or with: node examples/transports.example.ts
 */

import { createLogger, JsonTransport, PrettyTransport, CompactTransport, ClassicTransport, CompositeTransport } from '../dist/index.js';

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('🔥 @syntrojs/logger - All Transports Demo\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// ──────────────────────────────────────────────────────────────────────────
// JSON Transport (Production)
// ──────────────────────────────────────────────────────────────────────────

console.log('📦 1. JSON Transport (Production)\n');
const jsonLogger = createLogger({
  name: 'my-api',
  level: 'info',
  transport: 'json' // or new JsonTransport()
});

jsonLogger.info({ method: 'GET', path: '/users', statusCode: 200 }, 'Request completed');
jsonLogger.error({ error: new Error('Database timeout') }, 'Failed to fetch users');
jsonLogger.close(); // Flush buffer to show logs

console.log('\n');

// ──────────────────────────────────────────────────────────────────────────
// Pretty Transport (Development)
// ──────────────────────────────────────────────────────────────────────────

console.log('🎨 2. Pretty Transport (Development)\n');
const prettyLogger = createLogger({
  name: 'dev-server',
  level: 'debug',
  transport: 'pretty' // or new PrettyTransport()
});

prettyLogger.info({ userId: 123, action: 'login' }, 'User logged in');
prettyLogger.debug({ query: 'SELECT * FROM users', duration: 45 }, 'Database query executed');
prettyLogger.warn({ memory: '1.2GB' }, 'High memory usage detected');
prettyLogger.error({ error: 'Connection timeout' }, 'Failed to connect to Redis');

console.log('\n');

// ──────────────────────────────────────────────────────────────────────────
// Compact Transport (CI/CD, Terminals)
// ──────────────────────────────────────────────────────────────────────────

console.log('📏 3. Compact Transport (CI/CD, Terminals)\n');
const compactLogger = createLogger({
  name: 'ci-pipeline',
  level: 'info',
  transport: 'compact' // or new CompactTransport()
});

compactLogger.info('Building project', { target: 'production' });
compactLogger.info('Running tests', { passed: 152, failed: 0 });
compactLogger.warn('Test coverage below threshold', { coverage: 78, threshold: 80 });

console.log('\n');

// ──────────────────────────────────────────────────────────────────────────
// Classic Transport (Log4j-style)
// ──────────────────────────────────────────────────────────────────────────

console.log('📝 4. Classic Transport (Log4j-style)\n');
const classicLogger = createLogger({
  name: 'legacy-app',
  level: 'info',
  transport: 'classic' // or new ClassicTransport()
});

classicLogger.info('Application started', { port: 3000 });
classicLogger.error('Database connection failed', { host: 'localhost', port: 5432 });
classicLogger.fatal('Application crashed', { reason: 'Out of memory' });

console.log('\n');

// ──────────────────────────────────────────────────────────────────────────
// Composite Transport (Multiple Outputs)
// ──────────────────────────────────────────────────────────────────────────

console.log('🔄 5. Composite Transport (Multiple Outputs)\n');
const compositeLogger = createLogger({
  name: 'production-api',
  level: 'info',
  transport: new CompositeTransport([
    new JsonTransport(),     // Log to file/aggregation
    new PrettyTransport()    // Log to console for debugging
  ])
});

compositeLogger.info({ requestId: 'req-123', userId: 456 }, 'User request processed');
compositeLogger.error({ requestId: 'req-124' }, 'Request validation failed');

console.log('\n');

// ──────────────────────────────────────────────────────────────────────────
// JSON Transport with Buffering (High Performance)
// ──────────────────────────────────────────────────────────────────────────

console.log('⚡ 6. JSON Transport with Buffering (High Performance)\n');
const bufferedLogger = createLogger({
  name: 'high-performance-api',
  level: 'info',
  transport: new JsonTransport({ bufferSize: 100 }) // Buffer 100 logs before flushing
});

// These will be buffered and flushed together
for (let i = 0; i < 5; i++) {
  bufferedLogger.info({ iteration: i }, `Processing item ${i}`);
}

// Manually flush the buffer
bufferedLogger.close();

console.log('\n');

// ──────────────────────────────────────────────────────────────────────────
// Child Loggers with Different Transports
// ──────────────────────────────────────────────────────────────────────────

console.log('👶 7. Child Loggers with Bindings\n');
const parentLogger = createLogger({
  name: 'microservices',
  level: 'info',
  transport: 'json'
});

// Child loggers inherit parent's transport but add their own bindings
const databaseLogger = parentLogger.child({ module: 'database' });
const apiLogger = parentLogger.child({ module: 'api' });
const cacheLogger = parentLogger.child({ module: 'cache' });

databaseLogger.info('Connected to PostgreSQL', { host: 'db.internal' });
apiLogger.info('API route registered', { method: 'POST', path: '/users' });
cacheLogger.info('Cache hit', { key: 'user:123', latency: 2 });
parentLogger.close(); // Flush buffer to show logs

console.log('\n');

// ──────────────────────────────────────────────────────────────────────────
// Formatted Messages with Metadata
// ──────────────────────────────────────────────────────────────────────────

console.log('💬 8. Formatted Messages with Metadata\n');
const formatLogger = createLogger({
  name: 'formatter-demo',
  level: 'info',
  transport: 'pretty'
});

// Simple message
formatLogger.info('Application started');

// Message with metadata object
formatLogger.info({ userId: 789, role: 'admin' }, 'User accessed admin panel');

// Formatted message (printf-style)
formatLogger.info('User %s logged in from IP %s', 'John Doe', '192.168.1.100');

// All together
formatLogger.info(
  { userId: 789 },
  'User %s processed %d requests in %dms',
  'John Doe',
  42,
  1250
);

console.log('\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ All transport examples completed!\n');
console.log('═══════════════════════════════════════════════════════════════\n');


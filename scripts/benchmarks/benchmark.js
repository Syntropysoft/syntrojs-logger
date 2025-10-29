/**
 * Simple benchmark: syntrojs-logger vs Pino
 * 
 * Run with: node benchmark.js
 * Or with: bun benchmark.js
 */

import { createLogger } from '../../dist/index.js';
import { Writable } from 'node:stream';

// Create a discard stream for silencing stdout during benchmarks
const discardStream = new Writable({
  write(chunk, encoding, callback) {
    callback();
  }
});

// Detect runtime
const RUNTIME = typeof Bun !== 'undefined' ? 'Bun' : `Node.js ${process.version}`;

// Try to import Pino (might not be installed)
let pino;
try {
  pino = await import('pino');
  pino = pino.default;
} catch {
  pino = null;
  console.log('⚠️  Pino not installed, skipping comparison');
}

const ITERATIONS = 100000;

function benchmark(name, fn) {
  const start = performance.now();
  fn();
  const end = performance.now();
  const time = end - start;
  const opsPerSec = Math.floor(ITERATIONS / (time / 1000));
  
  console.log(`${name.padEnd(30)} ${time.toFixed(2).padStart(8)} ms (${opsPerSec.toLocaleString()} ops/sec)`);
}

console.log(`\n🔥 Benchmark: syntrojs-logger${pino ? ' vs Pino' : ''}`);
console.log(`Runtime: ${RUNTIME}`);
console.log(`Iterations: ${ITERATIONS.toLocaleString()}\n`);

// Silence stdout during logs for fair comparison
const originalWrite = process.stdout.write.bind(process.stdout);

// Pino first to establish baseline
if (pino) {
  const pinoLogger = pino({
    name: 'benchmark',
    level: 'info'
  });

  benchmark('Pino (info)', () => {
    process.stdout.write = () => true; // Silence stdout during benchmark
    for (let i = 0; i < ITERATIONS; i++) {
      pinoLogger.info({ iteration: i }, 'Test message');
    }
    process.stdout.write = originalWrite; // Restore for output
  });
}

// Delay to stabilize
await new Promise(resolve => setTimeout(resolve, 1000));

// syntrojs-logger (uses JSON by default - super fast!)
const syntroLogger = createLogger({ 
  name: 'benchmark', 
  level: 'info'
});

benchmark('syntrojs-logger (info)', () => {
  process.stdout.write = () => true; // Silence stdout during benchmark
  for (let i = 0; i < ITERATIONS; i++) {
    syntroLogger.info('Test message', { iteration: i });
  }
  process.stdout.write = originalWrite; // Restore for output
});

// Delay between tests
await new Promise(resolve => setTimeout(resolve, 1000));

// Test with buffering for better I/O performance
const { JsonTransport } = await import('./dist/index.js');

const bufferedLogger100 = createLogger({ 
  name: 'benchmark', 
  level: 'info',
  transport: new JsonTransport({ bufferSize: 100 })
});

benchmark('syntrojs-logger (buffered:100)', () => {
  process.stdout.write = () => true; // Silence stdout during benchmark
  for (let i = 0; i < ITERATIONS; i++) {
    bufferedLogger100.info('Test message', { iteration: i });
  }
  process.stdout.write = originalWrite; // Restore for output
});
bufferedLogger100.close(); // Flush remaining buffer after benchmark

console.log('\n✅ Benchmark complete!\n');

/**
 * Example: Configurable Correlation ID (syntropyLog-style)
 * 
 * Shows how to configure the correlation ID key, enable auto-generation,
 * Shows how to configure the correlation ID key and enable auto-generation
 */

import { AsyncContext, getLogger } from '../context/Context';

/**
 * Configure the context manager
 */
AsyncContext.configure({
  correlationIdKey: 'x-correlation-id', // Custom header name
  autoGenerate: true, // Auto-generate if not present
});

async function handleRequest(req: any) {
  await AsyncContext.runAsync(async () => {
    // OPTIMIZATION: Set correlation ID once at the start of the context.
    // This avoids checks inside getCorrelationId() on every log call.
    const incomingCorrelationId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
    
    // Set from header, or let getCorrelationId() auto-generate and set it.
    // By calling it here, we ensure it's set for all subsequent operations.
    const correlationId = incomingCorrelationId || AsyncContext.getCorrelationId();
    AsyncContext.setCorrelationId(correlationId);
    
    const logger = getLogger('api');
    
    // This will automatically have the correlation ID (generated or from headers)
    logger.info('Request started', { path: req.path });
    
    // Get the correlation ID explicitly
    console.log('Correlation ID:', correlationId);
  });
}

// Example: Different correlation ID key
AsyncContext.configure({
  correlationIdKey: 'trace-id', // Use 'trace-id' instead
  autoGenerate: true,
});

// Example: Disable auto-generation (require it to be set manually)
AsyncContext.configure({
  autoGenerate: false,
});

// Example: FastAPI-style (request state pattern)
function fastApiStyleMiddleware(req: any, res: any, next: Function) {
  AsyncContext.run(() => {
    // OPTIMIZED PATTERN: Set correlation ID from headers or generate ONCE.
    const correlationId = req.headers['x-correlation-id'] || AsyncContext.getCorrelationId(); // Generates if needed
    AsyncContext.setCorrelationId(correlationId); // Explicitly set it
    
    // Store in "request state" (context)
    AsyncContext.set('requestId', req.id);
    AsyncContext.set('userId', req.user?.id);
    AsyncContext.set('ip', req.ip);
    
    next();
  });
}

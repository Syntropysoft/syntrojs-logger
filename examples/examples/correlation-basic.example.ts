/**
 * Example: Manual Correlation ID with child()
 * 
 * For simple cases where you pass the correlation ID explicitly
 */

import { getLogger } from '../LoggerRegistry';

// In your request handler
async function handleRequest(request: any) {
  const correlationId = request.headers['x-correlation-id'] || 'req-123';
  
  // Create a child logger with correlation ID
  const logger = getLogger('api').child({ 
    correlationId,
    requestId: request.id 
  });
  
  logger.info('Request started', { path: request.path });
  
  // Use in your logic
  await processRequest(logger);
  
  logger.info('Request completed');
}

async function processRequest(logger: any) {
  logger.info('Processing...');
}


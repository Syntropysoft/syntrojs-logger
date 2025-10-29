/**
 * Example: Automatic Correlation ID with AsyncContext
 * 
 * This shows how to use AsyncContext to automatically propagate
 * correlation IDs through all async operations without passing them explicitly
 */

import { getLogger } from '../LoggerRegistry';
import { AsyncContext } from '../context/Context';

// Your middleware or request handler
async function handleRequest(req: any, res: any) {
  const correlationId = req.headers['x-correlation-id'] || generateId();
  
  // Wrap your request handling in AsyncContext
  await AsyncContext.runAsync(async () => {
    // Set correlation ID in context
    AsyncContext.setCorrelationId(correlationId);
    AsyncContext.set('userId', req.user?.id);
    AsyncContext.set('requestId', req.id);
    
    // Now all logs automatically include correlation ID!
    const logger = getLogger('api');
    logger.info('Request started', { 
      method: req.method, 
      path: req.path 
    });
    
    // Call your business logic - correlation ID is automatically included
    await processRequest();
    
    logger.info('Request completed');
  });
}

async function processRequest() {
  const logger = getLogger('api');
  
  // This log automatically includes the correlation ID from context!
  logger.info('Processing request');
  
  // Even nested async calls get the correlation ID
  await callDatabase();
  await callExternalAPI();
}

async function callDatabase() {
  const logger = getLogger('api');
  
  // Correlation ID is automatically here too!
  logger.info('Database query executed', { table: 'users' });
}

async function callExternalAPI() {
  const logger = getLogger('api');
  
  // And here!
  logger.info('External API called', { url: 'https://api.example.com' });
}

function generateId() {
  return Math.random().toString(36).substring(7);
}


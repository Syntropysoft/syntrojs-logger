/**
 * Example usage of @syntrojs/logger
 */

import { createLogger } from '../dist/index.js';

// Basic usage
const logger = createLogger({ name: 'example-app', level: 'debug' });

logger.info('Starting application...');
logger.debug('Debug mode enabled');
logger.warn('This is a warning');
logger.error('This is an error');

// With metadata
logger.info({ userId: 123, action: 'login' }, 'User logged in');

// With formatting
logger.info('User %s logged in from %s', 'John Doe', '192.168.1.1');

// Child loggers
const dbLogger = logger.child({ module: 'database' });
const apiLogger = logger.child({ module: 'api' });

dbLogger.info('Connected to database');
apiLogger.info('API endpoint hit', { method: 'GET', path: '/users' });

// With source
const userLogger = logger.withSource('UserService');
userLogger.info('Creating user', { username: 'john' });

// Different transports
const jsonLogger = createLogger({
  name: 'json-app',
  transport: 'json',
  level: 'info'
});

jsonLogger.info('This will output JSON');

// Compact transport
const compactLogger = createLogger({
  name: 'compact-app',
  transport: 'compact',
  level: 'info'
});

compactLogger.info({ key1: 'value1', key2: 'value2' }, 'Compact log with metadata');


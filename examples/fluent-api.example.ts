/**
 * Fluent API Examples
 * 
 * Demonstrates the fluent API methods: withSource, withTransactionId, and withRetention
 * 
 * Run with: bun examples/fluent-api.example.ts
 * Or with: node examples/fluent-api.example.ts
 */

import { createLogger, type LogRetentionRules } from '../dist/index.js';

// ============================================================================
// Example 1: Basic Fluent API Usage
// ============================================================================

console.log('\n=== Example 1: Basic Fluent API Usage ===\n');

const logger = createLogger({ name: 'example-app' });

// With Source - Identify the module/component
const userLogger = logger.withSource('UserService');
userLogger.info('User created successfully');
userLogger.error('Failed to create user');

// With Transaction ID - Track across services
const txLogger = logger.withTransactionId('tx-payment-123');
txLogger.info({ userId: 123, amount: 100.0 }, 'Processing payment');

// ============================================================================
// Example 2: Metadata - Compliance/Retention Rules
// ============================================================================

console.log('\n=== Example 2: Metadata - Compliance/Retention Rules ===\n');

const numericRules: LogRetentionRules = {
  ttl: 3600,              // 1 hour in seconds
  maxEntries: 10000,
  archiveAfter: 259200,   // 3 days
  deleteAfter: 2592000    // 30 days
};

const complianceLogger = logger.withRetention(numericRules);
complianceLogger.info({ action: 'payment', amount: 50.0 }, 'Payment processed');

// ============================================================================
// Example 3: Metadata - Business/Campaign Information
// ============================================================================

console.log('\n=== Example 3: Metadata - Campaign/Advertising Data ===\n');

const campaignMetadata: LogRetentionRules = {
  campaignId: 'summer-2024',
  channel: 'social-media',
  targetAudience: 'millennials',
  budget: 50000,
  startDate: '2024-06-01',
  endDate: '2024-08-31'
};

const campaignLogger = logger.withRetention(campaignMetadata);
campaignLogger.info({ 
  userId: 12345,
  action: 'ad-click',
  conversion: true
}, 'Campaign event tracked');

// ============================================================================
// Example 4: Metadata - Internal Process Information
// ============================================================================

console.log('\n=== Example 4: Metadata - Internal Process Data ===\n');

const processMetadata: LogRetentionRules = {
  workflowId: 'wf-data-processing-123',
  pipeline: 'etl-pipeline',
  stage: 'transformation',
  queue: 'high-priority',
  department: 'data-engineering',
  project: 'customer-analytics',
  environment: 'production'
};

const processLogger = logger.withRetention(processMetadata);
processLogger.info({ 
  recordCount: 10000,
  processingTime: 45.2
}, 'Data transformation completed');

// ============================================================================
// Example 5: Metadata - Everything Combined (Maximum Flexibility)
// ============================================================================

console.log('\n=== Example 5: Metadata - All Types Combined ===\n');

const allMetadata: LogRetentionRules = {
  // Compliance (nested objects)
  compliance: {
    policy: 'ORG-RETENTION-POLICY-2024',
    standards: ['GDPR', 'CCPA'],
    retention: {
      period: '1-year',
      archive: {
        enabled: true,
        location: 's3://archive-bucket',
        format: 'parquet'
      }
    },
    encryption: {
      algorithm: 'AES-256',
      keyRotation: '90-days',
      enabled: true
    }
  },
  
  // Business/Campaign (nested with arrays)
  business: {
    campaign: {
      id: 'q4-2024',
      channels: ['email', 'social', 'sms'],
      target: {
        segment: 'enterprise',
        demographics: {
          age: [30, 55],
          location: ['US', 'CA', 'EU']
        }
      }
    },
    product: {
      id: 'prod-xyz',
      category: 'analytics',
      version: '2.1.0'
    }
  },
  
  // Internal Processes (deeply nested)
  internal: {
    workflow: {
      id: 'wf-analytics',
      department: 'product',
      project: {
        name: 'dashboard-v2',
        team: ['engineer-1', 'engineer-2'],
        milestones: [
          { name: 'alpha', date: '2024-01-15' },
          { name: 'beta', date: '2024-02-20' }
        ]
      },
      pipeline: {
        stages: {
          extraction: { source: 'db', format: 'sql' },
          transformation: { rules: ['clean', 'validate', 'enrich'] },
          load: { destination: 'warehouse', method: 'batch' }
        }
      }
    }
  },
  
  // Arrays of nested objects
  metadata: [
    { type: 'tag', value: 'production' },
    { type: 'tag', value: 'critical' }
  ],
  
  // Mixed types at root level
  customField: 'any-value',
  numbers: 123,
  arrays: ['any', 'json', 'values']
};

const fullMetadataLogger = logger.withRetention(allMetadata);
fullMetadataLogger.info({ 
  userId: 789,
  operation: 'data-export' 
}, 'Operation completed with full metadata');

// ============================================================================
// Example 6: Method Chaining - All Together
// ============================================================================

console.log('\n=== Example 6: Method Chaining - Complete Example ===\n');

const paymentMetadata: LogRetentionRules = {
  // Compliance (nested)
  compliance: {
    policy: 'PAYMENT-COMPLIANCE-2024',
    retention: {
      period: '5-years',
      requirements: {
        encryption: 'AES-256',
        audit: true,
        backup: {
          frequency: 'daily',
          location: 's3://backups'
        }
      }
    }
  },
  
  // Business (nested)
  business: {
    provider: {
      name: 'stripe',
      accountId: 'acct_123',
      settings: {
        currency: 'USD',
        region: 'us-east-1'
      }
    }
  },
  
  // Internal (nested)
  internal: {
    team: {
      name: 'payments-engineering',
      members: ['lead-1', 'eng-2', 'eng-3'],
      onCall: {
        schedule: 'rotation',
        contact: 'slack'
      }
    }
  }
};

const fullLogger = logger
  .withSource('payment-service')
  .withTransactionId('tx-payment-abc-123')
  .withRetention(paymentMetadata);

fullLogger.info({ 
  userId: 456,
  amount: 250.0,
  currency: 'USD',
  method: 'credit-card'
}, 'Payment processed successfully');

fullLogger.error({ 
  userId: 456,
  amount: 250.0,
  errorCode: 'INSUFFICIENT_FUNDS'
}, 'Payment failed');

// ============================================================================
// Example 7: Multiple Child Loggers with Different Contexts
// ============================================================================

console.log('\n=== Example 7: Multiple Contexts ===\n');

const apiLogger = logger.withSource('api-service');
const dbLogger = logger.withSource('database-service');
const cacheLogger = logger.withSource('cache-service');

// Different transaction IDs for different requests
const request1Logger = apiLogger.withTransactionId('req-001');
const request2Logger = apiLogger.withTransactionId('req-002');

request1Logger.info({ endpoint: '/users', method: 'GET' }, 'Request processed');
request2Logger.info({ endpoint: '/orders', method: 'POST' }, 'Request processed');

dbLogger.info({ query: 'SELECT * FROM users', duration: 45 }, 'Query executed');
cacheLogger.info({ key: 'user:123', hit: true }, 'Cache accessed');

// ============================================================================
// Example 8: Complex Metadata - Deep Nesting for Enterprise Use Cases
// ============================================================================

console.log('\n=== Example 8: Complex Metadata - Deep Nesting ===\n');

// Real-world example: Complex metadata for enterprise applications
// This shows how you can structure deeply nested metadata for any use case
const complexMetadata: LogRetentionRules = {
  // Compliance with nested regulations
  compliance: {
    regulations: {
      gdpr: {
        version: '2024.1',
        articles: [6, 17, 32],
        requirements: {
          dataMinimization: true,
          rightToErasure: true,
          encryption: {
            algorithm: 'AES-256-GCM',
            keyManagement: {
              provider: 'aws-kms',
              rotation: '90-days',
              backup: {
                enabled: true,
                location: 's3://kms-backups'
              }
            }
          }
        }
      },
      hipaa: {
        version: '2023',
        sections: ['164.312', '164.314'],
        requirements: {
          accessControls: {
            authentication: 'mfa-required',
            authorization: 'role-based',
            audit: {
              enabled: true,
              retention: '7-years',
              alerts: ['unauthorized-access', 'data-export']
            }
          }
        }
      }
    },
    retention: {
      policies: [
        {
          category: 'financial',
          period: '7-years',
          archive: {
            format: 'parquet',
            compression: 'snappy',
            location: {
              primary: 's3://financial-archive',
              backup: 's3://financial-archive-backup',
              region: 'us-east-1'
            }
          }
        },
        {
          category: 'medical',
          period: '10-years',
          encryption: 'required',
          access: {
            roles: ['doctor', 'admin'],
            logging: 'all-access'
          }
        }
      ]
    }
  },
  
  // Business metadata - marketing campaigns with complex targeting
  business: {
    marketing: {
      campaigns: [
        {
          id: 'summer-2024',
          name: 'Summer Sale 2024',
          channels: {
            email: {
              enabled: true,
              segments: ['premium', 'regular'],
              schedule: {
                timezone: 'UTC',
                windows: [
                  { start: '09:00', end: '17:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] }
                ]
              }
            },
            social: {
              platforms: ['facebook', 'twitter', 'linkedin'],
              budgets: {
                facebook: 10000,
                twitter: 5000,
                linkedin: 8000
              }
            }
          },
          targeting: {
            demographics: {
              age: { min: 25, max: 55 },
              location: ['US', 'CA', 'UK', 'AU'],
              income: { min: 50000, currency: 'USD' }
            },
            behavior: {
              interests: ['technology', 'finance'],
              purchaseHistory: {
                minPurchases: 2,
                timeWindow: '90-days'
              }
            }
          }
        }
      ]
    },
    product: {
      catalog: {
        products: [
          {
            id: 'prod-123',
            category: {
              main: 'fintech',
              sub: 'payments',
              tags: ['api', 'integration', 'enterprise']
            },
            pricing: {
              model: 'subscription',
              tiers: [
                { name: 'starter', price: 99, currency: 'USD' },
                { name: 'professional', price: 299, currency: 'USD' },
                { name: 'enterprise', price: 999, currency: 'USD' }
              ]
            },
            features: {
              api: {
                version: 'v2.1',
                rateLimit: '1000/hour',
                authentication: ['oauth2', 'api-key']
              }
            }
          }
        ]
      }
    }
  },
  
  // Internal processes - complex workflow tracking
  internal: {
    workflows: [
      {
        id: 'wf-order-processing',
        version: '3.2',
        stages: {
          validation: {
            rules: [
              { type: 'payment', validator: 'stripe', timeout: 5000 },
              { type: 'inventory', validator: 'warehouse-api', timeout: 3000 }
            ],
            onFailure: {
              action: 'retry',
              maxAttempts: 3,
              backoff: { strategy: 'exponential', base: 1000, max: 10000 }
            }
          },
          processing: {
            steps: [
              {
                name: 'payment-capture',
                service: 'payment-service',
                config: {
                  provider: 'stripe',
                  webhook: {
                    url: 'https://api.example.com/webhooks/stripe',
                    secret: 'whsec_...',
                    timeout: 30000
                  }
                }
              },
              {
                name: 'order-creation',
                service: 'order-service',
                dependencies: ['payment-capture'],
                retry: {
                  enabled: true,
                  maxAttempts: 5
                }
              }
            ]
          }
        },
        monitoring: {
          alerts: [
            {
              condition: 'stage-duration > 30s',
              action: 'pagerduty',
              severity: 'warning'
            },
            {
              condition: 'failure-rate > 5%',
              action: 'slack',
              severity: 'critical'
            }
          ]
        }
      }
    ],
    infrastructure: {
      services: {
        database: {
          type: 'postgresql',
          cluster: {
            primary: { host: 'db-primary.example.com', port: 5432 },
            replicas: [
              { host: 'db-replica-1.example.com', port: 5432, region: 'us-east-1' },
              { host: 'db-replica-2.example.com', port: 5432, region: 'us-west-2' }
            ]
          },
          pool: {
            min: 5,
            max: 20,
            idleTimeout: 30000
          }
        },
        cache: {
          type: 'redis',
          cluster: {
            nodes: [
              { host: 'redis-1.example.com', port: 6379 },
              { host: 'redis-2.example.com', port: 6379 },
              { host: 'redis-3.example.com', port: 6379 }
            ]
          },
          ttl: {
            default: 3600,
            patterns: [
              { pattern: 'user:*', ttl: 7200 },
              { pattern: 'session:*', ttl: 1800 }
            ]
          }
        }
      }
    }
  },
  
  // Custom metadata - anything your organization needs
  custom: {
    tenant: {
      id: 'tenant-abc-123',
      organization: 'Acme Corp',
      tier: 'enterprise',
      settings: {
        features: {
          analytics: {
            enabled: true,
            retention: '90-days',
            export: {
              formats: ['json', 'csv', 'parquet'],
              frequency: 'daily'
            }
          },
          integrations: {
            enabled: ['slack', 'jira', 'salesforce'],
            webhooks: {
              url: 'https://webhooks.acme.com/logs',
              auth: {
                type: 'bearer',
                token: '***'
              }
            }
          }
        }
      }
    }
  }
};

const complexLogger = logger.withRetention(complexMetadata);
complexLogger.info({ 
  event: 'order-processed',
  orderId: 'order-12345',
  amount: 299.99
}, 'Complex metadata example - order processing completed');

// ============================================================================
// Example 9: Organization-Specific Metadata (Any Structure)
// ============================================================================

console.log('\n=== Example 9: Organization-Specific Metadata ===\n');

// Finance sector - compliance focused
const financeMetadata: LogRetentionRules = {
  policy: 'FINANCE-REG-2024',
  compliance: 'SOX-404',
  retentionPeriod: '10-years',
  retentionCode: 'FR-RET-10Y',
  legalHold: false,
  auditTrail: true,
  department: 'treasury'
};

// Tech company - product and analytics focused
const techMetadata: LogRetentionRules = {
  policy: 'TECH-DATA-RETENTION-2024',
  retentionPeriod: '90-days',
  anonymization: 'after-30-days',
  gdprCompliant: true,
  dataMinimization: true,
  product: 'mobile-app',
  version: '2.1.0',
  feature: 'analytics-dashboard'
};

const financeLogger = logger.withRetention(financeMetadata);
const techLogger = logger.withRetention(techMetadata);

financeLogger.info({ accountId: 'ACC-123', operation: 'transfer' }, 'Financial transaction');
techLogger.info({ userAction: 'login', ipAddress: 'xxx.xxx.xxx.xxx' }, 'User activity logged');

// ============================================================================
// Example 10: Logger Registry Pattern - Multiple Loggers with Complex Metadata
// ============================================================================

console.log('\n=== Example 10: Logger Registry - Multiple Loggers with Complex Metadata ===\n');

// Registry pattern: Create multiple loggers with different complex metadata
// Each logger can be retrieved and used on-demand for different contexts

interface LoggerRegistry {
  [key: string]: ReturnType<typeof createLogger>;
}

const loggerRegistry: LoggerRegistry = {};

// 1. Payment Service Logger - with compliance, business, and workflow metadata
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
        },
        gdpr: {
          articles: [6, 7, 32],
          dataProcessing: {
            legalBasis: 'contract',
            consent: 'explicit',
            rightToErasure: true
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
            card: { percentage: 2.9, fixed: 0.30 },
            ach: { percentage: 0.8, fixed: 0.25 }
          }
        }
      },
      vendor: {
        primary: 'stripe',
        backup: 'paypal',
        settings: {
          webhookUrl: 'https://api.example.com/webhooks/payments',
          retryPolicy: {
            maxAttempts: 3,
            backoff: 'exponential'
          }
        }
      }
    },
    internal: {
      team: {
        name: 'payments-engineering',
        onCall: {
          schedule: 'rotation',
          escalation: ['slack', 'pagerduty']
        }
      },
      monitoring: {
        metrics: ['transaction-volume', 'error-rate', 'latency-p95'],
        alerts: {
          errorRate: { threshold: 0.05, severity: 'critical' },
          latency: { threshold: 500, severity: 'warning' }
        }
      }
    }
  });

// 2. Order Processing Logger - with workflow and inventory metadata
loggerRegistry['order-service'] = createLogger({ name: 'order-service' })
  .withRetention({
    business: {
      workflow: {
        stages: {
          validation: {
            rules: ['payment', 'inventory', 'shipping'],
            timeout: 5000
          },
          processing: {
            steps: ['payment-capture', 'order-creation', 'inventory-reserve'],
            retry: { maxAttempts: 3 }
          },
          fulfillment: {
            providers: ['warehouse-a', 'warehouse-b'],
            priority: 'standard'
          }
        }
      },
      inventory: {
        system: 'warehouse-api',
        reserves: {
          ttl: 3600,
          autoRelease: true
        }
      }
    },
    internal: {
      service: {
        dependencies: ['payment-service', 'inventory-service', 'shipping-service'],
        circuitBreaker: {
          enabled: true,
          failureThreshold: 5,
          resetTimeout: 60000
        }
      }
    }
  });

// 3. User Analytics Logger - with campaign and analytics metadata
loggerRegistry['analytics-service'] = createLogger({ name: 'analytics-service' })
  .withRetention({
    business: {
      campaigns: {
        active: [
          {
            id: 'summer-2024',
            channels: ['email', 'push', 'in-app'],
            targeting: {
              segments: ['premium', 'active'],
              demographics: { age: [25, 45], location: 'US' }
            },
            budgets: {
              daily: 1000,
              total: 50000
            }
          }
        ]
      },
      analytics: {
        tracking: {
          events: ['page-view', 'click', 'conversion'],
          properties: {
            userId: 'hashed',
            ipAddress: 'anonymized',
            deviceId: 'tracked'
          }
        },
        aggregation: {
          window: 'hourly',
          metrics: ['count', 'unique', 'revenue']
        }
      }
    },
    compliance: {
      privacy: {
        gdpr: {
          anonymization: 'required',
          consentTracking: true
        },
        ccpa: {
          doNotSell: 'respect',
          optOut: 'honored'
        }
      }
    }
  });

// 4. Database Service Logger - with infrastructure and performance metadata
loggerRegistry['database-service'] = createLogger({ name: 'database-service' })
  .withRetention({
    infrastructure: {
      database: {
        type: 'postgresql',
        version: '15.2',
        cluster: {
          primary: {
            host: 'db-primary.example.com',
            region: 'us-east-1',
            connectionPool: {
              min: 10,
              max: 100,
              idleTimeout: 30000
            }
          },
          replicas: [
            {
              host: 'db-replica-1.example.com',
              region: 'us-east-1',
              lag: { max: 100 }
            },
            {
              host: 'db-replica-2.example.com',
              region: 'us-west-2',
              lag: { max: 200 }
            }
          ]
        },
        performance: {
          queryTimeout: 5000,
          slowQueryThreshold: 1000,
          indexes: {
            monitored: ['users_email_idx', 'orders_user_id_idx']
          }
        }
      }
    },
    internal: {
      monitoring: {
        metrics: ['connection-pool-size', 'query-duration-p95', 'replication-lag'],
        alerts: {
          connectionPoolExhausted: { severity: 'critical' },
          slowQueries: { threshold: 100, severity: 'warning' }
        }
      }
    }
  });

// Usage: Retrieve and use loggers on-demand
console.log('--- Using payment-service logger ---');
loggerRegistry['payment-service']
  .withTransactionId('tx-payment-12345')
  .info({ 
    amount: 299.99,
    currency: 'USD',
    method: 'card'
  }, 'Payment processed');

console.log('--- Using order-service logger ---');
loggerRegistry['order-service']
  .withTransactionId('tx-order-67890')
  .withSource('order-api')
  .info({ 
    orderId: 'order-123',
    userId: 456,
    items: 3,
    total: 599.98
  }, 'Order created');

console.log('--- Using analytics-service logger ---');
loggerRegistry['analytics-service']
  .withTransactionId('tx-analytics-abc')
  .info({ 
    event: 'purchase-completed',
    userId: 789,
    revenue: 299.99,
    campaignId: 'summer-2024'
  }, 'Analytics event tracked');

console.log('--- Using database-service logger ---');
loggerRegistry['database-service']
  .withSource('query-executor')
  .info({ 
    query: 'SELECT * FROM orders WHERE user_id = $1',
    duration: 45,
    rows: 10
  }, 'Query executed successfully');

// Helper function to get logger by name (similar to Instance Registry pattern)
function getLogger(name: string): ReturnType<typeof createLogger> | undefined {
  return loggerRegistry[name];
}

// Example: Using the helper function
const paymentLogger = getLogger('payment-service');
if (paymentLogger) {
  paymentLogger
    .withTransactionId('tx-helper-123')
    .warn({ 
      amount: 1000.00,
      reason: 'amount-exceeded-threshold'
    }, 'Large payment detected');
}

console.log('\n=== All examples completed! ===\n');

// Close all loggers to flush buffers
// Note: Each logger in the registry has its own transport, so close them individually
(async () => {
  await logger.close();
  for (const loggerName in loggerRegistry) {
    await loggerRegistry[loggerName].close();
  }
})();


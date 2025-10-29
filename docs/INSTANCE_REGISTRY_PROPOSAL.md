# Instance Registry Pattern - Proposal

## Concept

Un singleton centralizado que permite:
1. Registrar instancias configuradas por nombre al inicio de la app
2. Recuperar instancias por nombre desde cualquier lugar de la app
3. Inferir tipos automáticamente para type-safety
4. Soportar múltiples instancias del mismo tipo con diferentes configuraciones

## Use Case

```typescript
// Setup al inicio (main.ts o bootstrap)
import { getInstanceRegistry } from '@syntrojs/logger/registry';
import Redis from 'redis';
import axios from 'axios';
import { Kafka } from 'kafkajs';

const registry = getInstanceRegistry();

// Registrar múltiples instancias del mismo tipo
registry.register('cacheRedis', redisCacheClient);
registry.register('sessionRedis', redisSessionClient);

// Registrar diferentes tipos
registry.register('userApi', axiosInstance1);
registry.register('paymentApi', axiosInstance2);
registry.register('eventsKafka', kafkaProducer);
registry.register('logsKafka', kafkaConsumer);

// Usar en cualquier parte de la app con type inference
const cache = registry.get('cacheRedis'); // Tipo: Redis
const userApi = registry.get('userApi');  // Tipo: AxiosInstance
const events = registry.get('eventsKafka'); // Tipo: KafkaProducer
```

## Implementation

```javascript
// src/registry/InstanceRegistry.js (JavaScript, sin TypeScript)

export class InstanceRegistry {
  #instances = new Map();

  register(name, instance) {
    if (this.#instances.has(name)) {
      throw new Error(`Instance '${name}' already registered`);
    }
    this.#instances.set(name, instance);
  }

  get(name) {
    const instance = this.#instances.get(name);
    if (!instance) {
      throw new Error(`Instance '${name}' not found`);
    }
    return instance;
  }

  has(name) {
    return this.#instances.has(name);
  }

  list() {
    return Array.from(this.#instances.keys());
  }

  clear() {
    this.#instances.clear();
  }
}

export const instanceRegistry = new InstanceRegistry();

export function getInstanceRegistry() {
  return instanceRegistry;
}
```

**Why JavaScript?**
- ✅ Sin problemas de tipos - acepta cualquier tipo de objeto
- ✅ Más flexible en runtime
- ✅ Compatible con todos los tipos: Redis, Axios, Kafka, clases custom, etc.
- ✅ Puede ser consumido desde TypeScript con type inference por uso

## Benefits

1. **Single Source of Truth** - Todas las instancias configuradas en un lugar
2. **Type Safety** - TypeScript infiere los tipos automáticamente
3. **Flexibility** - Puedes registrar cualquier tipo de objeto
4. **Testability** - Fácil de mockear en tests
5. **Clean Architecture** - No necesitas pasar instancias por todos lados

## Example: Multi-Redis Setup

```typescript
import Redis from 'redis';

// Configurar múltiples Redis con diferentes configuraciones
const cacheRedis = new Redis({
  url: 'redis://cache:6379',
  maxRetries: 3
});

const sessionRedis = new Redis({
  url: 'redis://session:6379',
  retryStrategy: (times) => times * 1000
});

const metricsRedis = new Redis({
  url: 'redis://metrics:6379',
  enableReadyCheck: false
});

// Registrar todos
registry.register('cacheRedis', cacheRedis);
registry.register('sessionRedis', sessionRedis);
registry.register('metricsRedis', metricsRedis);

// Usar con type safety
const cache = registry.get<Redis>('cacheRedis');
await cache.set('key', 'value');
```

## Example: Multi-API Setup

```typescript
import axios from 'axios';

const userApi = axios.create({
  baseURL: 'https://api.users.com',
  headers: { 'Authorization': `Bearer ${token}` }
});

const paymentApi = axios.create({
  baseURL: 'https://api.payments.com',
  headers: { 'X-API-Key': paymentKey }
});

registry.register('userApi', userApi);
registry.register('paymentApi', paymentApi);

// Type inference automático
const users = registry.get('userApi'); // AxiosInstance
const payments = registry.get('paymentApi'); // AxiosInstance
```

## Integration with Logger

```typescript
// Logger puede usar el registry internamente
import { getInstanceRegistry } from '@syntrojs/logger/registry';

const logger = createLogger({ 
  name: 'my-service',
  useRegistry: true // Opcional, usar registry para clients
});

// Si hay Redis en el registry, loguear métricas automáticamente
// Si hay Kafka, enviar logs críticos automáticamente
```

## Future Enhancements

1. **Lifecycle Management** - Registros con lifecycle hooks (init, close, etc.)
2. **Health Checks** - Verificar estado de instancias
3. **Metrics** - Monitorear uso de instancias
4. **Auto-recovery** - Reconectar automáticamente si falla
5. **Configuration Validation** - Validar configuración al registrar

## Open Questions

1. ¿Debería ser parte del logger o un paquete separado `@syntrojs/registry`?
2. ¿Soporte para async initialization (ej. Redis.connect())?
3. ¿Soporte para lazy loading de instancias?
4. ¿Integración con dependency injection frameworks?


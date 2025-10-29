# Instance Registry Pattern - Proposal

**Package Name:** `@syntrojs/singleton`

## Concept

Un singleton centralizado que permite:
1. Registrar instancias configuradas por nombre al inicio de la app
2. Recuperar instancias por nombre desde cualquier lugar de la app
3. Inferir tipos automáticamente para type-safety
4. Soportar múltiples instancias del mismo tipo con diferentes configuraciones

## Use Case

```typescript
// Setup al inicio (main.ts o bootstrap)
import { getInstanceRegistry } from '@syntrojs/singleton';
import Redis from 'redis';
import axios from 'axios';
import { Kafka } from 'kafkajs';

const registry = getInstanceRegistry();

// Registrar instancias configuradas con tipos explícitos
registry.register('cacheRedis', redisCacheClient, 'Redis');
registry.register('sessionRedis', redisSessionClient, 'Redis');
registry.register('userApi', axiosInstance1, 'AxiosInstance');
registry.register('paymentApi', axiosInstance2, 'AxiosInstance');
registry.register('eventsKafka', kafkaProducer, 'KafkaProducer');
registry.register('logsKafka', kafkaConsumer, 'KafkaConsumer');

// Usar desde cualquier lugar de la app con type safety
const cache = registry.get<Redis>('cacheRedis');
const userApi = registry.get<AxiosInstance>('userApi');
const events = registry.get<Producer>('eventsKafka');

// Obtener metadatos para debugging
const entry = registry.getEntry('cacheRedis');
console.log(`Instance: ${entry.name}, Type: ${entry.type}`);

// Listar todas las instancias registradas
const instances = registry.list();
console.log(instances); // [{name: 'cacheRedis', type: 'Redis'}, ...]
```

## Implementation

```typescript
// src/registry/InstanceRegistry.ts

interface RegistryEntry<T = any> {
  name: string;
  instance: T;
  type: string;        // 'Redis', 'Axios', 'Kafka', etc.
  constructor: Function; // Para validación de tipo
}

export class InstanceRegistry {
  #instances = new Map<string, RegistryEntry>();

  register<T>(name: string, instance: T, type?: string): void {
    if (this.#instances.has(name)) {
      throw new Error(`Instance '${name}' already registered`);
    }
    
    const entry: RegistryEntry<T> = {
      name,
      instance,
      type: type || instance.constructor.name,
      constructor: instance.constructor
    };
    this.#instances.set(name, entry);
  }

  get<T>(name: string): T {
    const entry = this.#instances.get(name);
    if (!entry) {
      throw new Error(`Instance '${name}' not found`);
    }
    return entry.instance as T;
  }

  // Método para obtener metadatos completos
  getEntry(name: string): RegistryEntry | undefined {
    return this.#instances.get(name);
  }

  has(name: string): boolean {
    return this.#instances.has(name);
  }

  // Listar con metadatos
  list(): Array<{name: string, type: string}> {
    return Array.from(this.#instances.values()).map(entry => ({
      name: entry.name,
      type: entry.type
    }));
  }

  clear(): void {
    this.#instances.clear();
  }
}

export const instanceRegistry = new InstanceRegistry();

export function getInstanceRegistry(): InstanceRegistry {
  return instanceRegistry;
}
```

**Key Features:**
- ✅ **Type Safety**: Generic `get<T>()` method with proper casting
- ✅ **Metadata Storage**: Stores type information and constructor for debugging
- ✅ **Flexible Registration**: Auto-detects type or accepts custom type name
- ✅ **Rich API**: `getEntry()`, `list()` with metadata, `has()` checks
- ✅ **TypeScript Compatible**: Full type inference and casting support

## Benefits

1. **Single Source of Truth** - Todas las instancias configuradas en un lugar
2. **Type Safety** - Generic `get<T>()` method with proper casting
3. **Metadata Rich** - Stores type information and constructor for debugging
4. **Multiple Instances** - Múltiples instancias del mismo tipo con diferentes configs
5. **Centralized Management** - Un solo lugar para configurar todas las instancias
6. **Easy Testing** - Mock fácilmente las instancias en tests
7. **Runtime Introspection** - `getEntry()` and `list()` for debugging and monitoring

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
// Logger puede usar el singleton internamente
import { getInstanceRegistry } from '@syntrojs/singleton';

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

## Package Structure

**Package:** `@syntrojs/singleton` (paquete separado, independiente del logger)

**Benefits:**
- ✅ Puede ser usado con o sin el logger
- ✅ Reutilizable en cualquier proyecto
- ✅ Nombre claro y descriptivo

## Open Questions

1. ✅ **Decidido:** Será un paquete separado `@syntrojs/singleton`
2. ¿Soporte para async initialization (ej. Redis.connect())?
3. ¿Soporte para lazy loading de instancias?
4. ¿Integración con dependency injection frameworks?


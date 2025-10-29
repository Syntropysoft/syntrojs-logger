# Fluent API Analysis - syntropylog Reference

## Overview

Análisis de la API fluent de `syntropylog` para replicar la funcionalidad en `@syntrojs/logger`.

## API Fluent Methods en syntropylog

### 1. `withSource(source: string): ILogger`

**Propósito:** Crear un logger con un campo `source` bound para identificar el módulo/componente que genera el log.

**Implementación:**
```typescript
withSource(source: string): ILogger {
  return this.child({ source });
}
```

**Uso:**
```typescript
const redisLogger = logger.withSource('redis');
redisLogger.info('Connection established');
// Output: { ..., "source": "redis", ... }
```

**Beneficios:**
- Identifica qué componente/módulo generó el log
- Útil para filtrar logs por módulo
- Facilita debugging en arquitecturas modulares

---

### 2. `withTransactionId(transactionId: string): ILogger`

**Propósito:** Crear un logger con un campo `transactionId` bound para tracking de transacciones distribuidas.

**Implementación:**
```typescript
withTransactionId(transactionId: string): ILogger {
  return this.child({ transactionId });
}
```

**Uso:**
```typescript
const txLogger = logger.withTransactionId('tx-abc-123');
txLogger.info({ userId: 123 }, 'Processing payment');
// Output: { ..., "transactionId": "tx-abc-123", ... }
```

**Beneficios:**
- Tracking de transacciones a través de múltiples servicios
- Correlación de logs en sistemas distribuidos
- Útil para auditoría y debugging de flujos completos

---

### 3. `withRetention(rules: LogRetentionRules): ILogger`

**Propósito:** Crear un logger con reglas de retención bound para compliance y gestión de logs.

**Implementación:**
```typescript
withRetention(rules: LogRetentionRules): ILogger {
  return this.child({ retention: rules } as any);
}
```

**LogRetentionRules Type:**
```typescript
type LogRetentionRules = Record<string, JsonValue>;
```

**Completamente flexible:** Es simplemente un objeto JSON plano sin restricciones. Puedes usar:
- **Cualquier nombre de campo** (no hay campos obligatorios ni sugeridos)
- **Cualquier valor JSON-compatible** (string, number, boolean, array, objeto plano, null)
- **Cualquier estructura** que necesites para tu organización

**Ejemplos:**
- **Bancos:** `{ policy: 'BANK-RET-2024-A', compliance: 'Basel-III', retentionPeriod: '7-years' }`
- **Salud:** `{ policy: 'HIPAA-compliant-7years', encryption: 'AES-256', auditRequired: true }`
- **Cualquier organización:** `{ myCustomField: 'any-value', anotherField: 123, nested: { can: 'be', any: 'json' } }`

**Uso:**
```typescript
// Numeric values (seconds)
const complianceLogger = logger.withRetention({
  ttl: 3600,              // 1 hora
  maxEntries: 10000,
  archiveAfter: 259200,   // 3 días
  deleteAfter: 2592000   // 30 días
});

// String values (policy codes)
const bankingLogger = logger.withRetention({
  ttl: '30-days',
  policy: 'BANK-RET-2024-A',
  compliance: 'Basel-III'
});

// Mixed values
const healthcareLogger = logger.withRetention({
  policy: 'HIPAA-compliant-7years',
  retentionPeriod: '7-years',
  maxSize: 1024000000,
  encryption: 'AES-256'
});

complianceLogger.info({ action: 'payment' }, 'Payment processed');
// Output: { ..., "retention": { "ttl": 3600, "maxEntries": 10000, ... }, ... }
```

**Beneficios:**
- Compliance con políticas de retención
- Gestión automática de lifecycle de logs
- Integración con sistemas de archivado/eliminación
- Metadata para herramientas de log management

---

## Implementation Details

### Patrón Base

Todos los métodos fluent siguen el mismo patrón:

```typescript
withXxx(value: Type): ILogger {
  return this.child({ xxx: value });
}
```

**Principios de diseño:**
1. **Inmutabilidad:** Cada método retorna un nuevo logger (child), no modifica el original
2. **Chaining:** Permite encadenar métodos: `logger.withSource('api').withTransactionId('tx-1')`
3. **Simplicidad:** Usa `child()` internamente, que ya maneja bindings correctamente
4. **Type Safety:** Tipos específicos para cada método (no `any` excepto en `withRetention` por flexibilidad)

---

## Current Status en @syntrojs/logger

### ✅ Implementado
- `withSource(source: string): Logger` - Ya existe y funciona

### 📋 Pendiente
- `withTransactionId(transactionId: string): Logger`
- `withRetention(rules: LogRetentionRules): Logger`
- Tipo `LogRetentionRules` exportado

---

## Implementation Plan

### Step 1: Definir `LogRetentionRules` type

```typescript
// src/types.ts
export type LogRetentionRules = Record<string, JsonValue>;
```

**Completamente flexible:** Es simplemente un objeto JSON plano (`Record<string, JsonValue>`). Sin restricciones de campos, valores o estructura. Cada organización puede definir exactamente lo que necesite para su compliance.

### Step 2: Implementar `withTransactionId()`

```typescript
// src/Logger.ts
/**
 * Creates a new logger instance with a `transactionId` field bound to it.
 * This is useful for tracking a request across multiple services.
 * @param transactionId - The unique ID of the transaction.
 * @returns A new logger instance with the `transactionId` binding.
 */
withTransactionId(transactionId: string): Logger {
  return this.child({ transactionId });
}
```

### Step 3: Implementar `withRetention()`

```typescript
// src/Logger.ts
/**
 * Creates a new logger instance with a `retention` field bound to it.
 * The provided rules object will be included in all logs from this logger.
 * @param rules - A JSON object containing the retention rules.
 * @returns A new logger instance with the `retention` binding.
 */
withRetention(rules: LogRetentionRules): Logger {
  return this.child({ retention: rules });
}
```

### Step 4: Exportar tipos

```typescript
// src/index.ts
export type { LogRetentionRules } from './types'; // o './compliance/types'
```

---

## Testing Strategy

### Unit Tests Needed

1. **withTransactionId:**
   - Verificar que crea child logger
   - Verificar que `transactionId` aparece en logs
   - Verificar que no modifica logger original

2. **withRetention:**
   - Verificar que crea child logger
   - Verificar que `retention` aparece en logs
   - Verificar que acepta todas las propiedades de `LogRetentionRules`
   - Verificar que preserva valores custom en `[key: string]`

3. **Chaining:**
   - Verificar que se pueden encadenar: `logger.withSource('api').withTransactionId('tx-1').withRetention({...})`
   - Verificar que todos los bindings aparecen en el log final

---

## Use Cases

### Use Case 1: Microservice Request Tracking

```typescript
// En middleware de HTTP request
const txId = generateTransactionId();
const requestLogger = logger
  .withTransactionId(txId)
  .withSource('http-middleware');

requestLogger.info({ method: 'POST', path: '/users' }, 'Request received');
```

### Use Case 2: Compliance Logging

```typescript
// Logger específico para operaciones que requieren compliance
// Puede usar valores numéricos o strings (policy codes)

// Opción 1: Valores numéricos (seconds)
const complianceLogger = logger
  .withRetention({
    ttl: 3600,
    maxEntries: 10000,
    archiveAfter: 259200,   // 3 días
    deleteAfter: 2592000    // 30 días
  })
  .withSource('payment-service');

// Opción 2: Policy codes (strings) - para frameworks específicos
const bankingLogger = logger
  .withRetention({
    ttl: '30-days',
    policy: 'BANK-RET-2024-A',
    compliance: 'Basel-III'
  })
  .withSource('payment-service');

// Opción 3: Mixed - máximo flexibilidad
const healthcareLogger = logger
  .withRetention({
    policy: 'HIPAA-compliant-7years',
    retentionPeriod: '7-years',
    maxSize: 1024000000,
    encryption: 'AES-256'
  })
  .withSource('payment-service');

complianceLogger.info({ 
  userId: 123,
  amount: 100.00 
}, 'Payment processed');
```

### Use Case 3: Complex Chaining

```typescript
// Máxima granularidad para debugging
const debugLogger = logger
  .withSource('auth-module')
  .withTransactionId('tx-abc-123')
  .withRetention({
    ttl: 7200,
    archiveAfter: 86400
  });

debugLogger.debug({ 
  operation: 'token-validation',
  result: 'success'
}, 'Token validated');
```

---

## Advanced Considerations

### 1. Retención vs Compliance

`withRetention()` es principalmente metadata para herramientas externas. El logger no implementa la lógica de retención/archivado/eliminación - solo agrega la metadata a los logs.

**Tools que podrían usar esto:**
- Log aggregation tools (ELK, Splunk, etc.)
- Log management systems
- Compliance automation tools
- Archival systems

### 2. Performance

Como todos usan `child()` internamente, el overhead es mínimo (solo creación de nuevo logger con bindings). Los bindings se aplican eficientemente durante la construcción del JSON.

### 3. Extensibilidad y Flexibilidad Máxima

El tipo `LogRetentionRules` es simplemente `Record<string, JsonValue>` - **completamente sin restricciones**:
- **Cualquier nombre de campo** - No hay campos sugeridos ni obligatorios
- **Cualquier valor JSON** - string, number, boolean, array, objeto plano, null
- **Cualquier estructura** - Cada organización define su propio formato
- **Sin validación** - El logger solo pasa el JSON tal cual, sin interpretarlo

Esto permite que cada organización maneje compliance exactamente como quiera, sin restricciones del type system ni del logger.

---

## Reference Implementation (syntropylog)

### ILogger Interface
```typescript
export interface ILogger {
  // ... standard logging methods ...
  
  withSource(source: string): ILogger;
  withRetention(rules: LogRetentionRules): ILogger;
  withTransactionId(transactionId: string): ILogger;
}
```

### Logger Implementation
```typescript
export class Logger implements ILogger {
  // ... standard implementation ...
  
  withSource(source: string): ILogger {
    return this.child({ source });
  }

  withRetention(rules: LogRetentionRules): ILogger {
    return this.child({ retention: rules } as any);
  }

  withTransactionId(transactionId: string): ILogger {
    return this.child({ transactionId });
  }
}
```

---

## Next Steps

1. ✅ Analizar implementación de syntropylog
2. ✅ Implementar `LogRetentionRules` type - **COMPLETED**
3. ✅ Implementar `withTransactionId()` - **COMPLETED**
4. ✅ Implementar `withRetention()` - **COMPLETED**
5. ✅ Exportar tipos públicos - **COMPLETED**
6. 📋 Agregar tests
7. 📋 Actualizar documentación


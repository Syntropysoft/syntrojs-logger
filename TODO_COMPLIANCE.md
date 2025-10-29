# TODO: Compliance & Security Features

## Overview
Implementar sistema completo de compliance y seguridad basado en syntropylog, con ofuscación de datos sensibles, prevención de code injection, y configuración segura.

## Features to Implement

### 1. MaskingEngine (Ofuscación de Datos Sensibles)
**Source:** `/Users/gabrielalejandrogomez/source/libs/syntropy/syntropyLog/src/masking/MaskingEngine.ts`

**Key Features:**
- Ofuscar datos sensibles automáticamente antes de escribir logs
- Reglas por defecto para:
  - Credit cards (`CREDIT_CARD`)
  - SSN (`SSN`)
  - Emails (`EMAIL`)
  - Phone numbers (`PHONE`)
  - Passwords (`PASSWORD`)
  - Tokens (`TOKEN`)
  - Custom patterns (`CUSTOM`)
- Solo permitir **agregar** nuevas reglas, NO modificar existentes en caliente (seguridad)
- Usar estrategia de flattening JSON para performance O(n) independiente de profundidad
- Usar `regex-test` para validar con timeout (100ms)

**Implementation Details:**
```typescript
enum MaskingStrategy {
  CREDIT_CARD = 'credit_card',
  SSN = 'ssn',
  EMAIL = 'email',
  PHONE = 'phone',
  PASSWORD = 'password',
  TOKEN = 'token',
  CUSTOM = 'custom'
}

interface MaskingRule {
  pattern: string | RegExp;
  strategy: MaskingStrategy;
  customMask?: (value: string) => string;
  preserveLength?: boolean;
  maskChar?: string;
  _compiledPattern?: RegExp;
}
```

### 2. SanitizationEngine (Prevención de Code Injection)
**Source:** `/Users/gabrielalejandrogomez/source/libs/syntropy/syntropyLog/src/sanitization/SanitizationEngine.ts`

**Key Features:**
- Procesar **SOLO objetos planos** usando `data.constructor === Object`
- Filtro ANSI escape codes: `/[\x1b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g`
- NO procesar clases, instancias, o objetos especiales
- Prevenir log injection attacks que podrían explotar vulnerabilidades de terminal
- Integrar con MaskingEngine para ofuscación

**Why Flat Objects Only:**
```typescript
// Clave: Solo procesar objetos planos para no corromper instancias de clases.
if (
  typeof data === 'object' &&
  data !== null &&
  data.constructor === Object  // <- IMPORTANTE
) {
  // Procesar solo aquí
}
// Devuelve cualquier otro tipo (números, booleans, instancias, etc.) sin modificar
```

### 3. JSON Plano para Configuración de Compliance
**Security Requirements:**
- Validar que la configuración sea JSON plano (sin funciones, clases, etc.)
- NO permitir code injection en configuración
- Prevenir `JSON.parse()` maliciosos
- Validar que los valores sean primitivos o objetos planos

**Example Config:**
```json
{
  "masking": {
    "rules": [
      {
        "pattern": "password",
        "strategy": "password",
        "preserveLength": true,
        "maskChar": "*"
      },
      {
        "pattern": "email",
        "strategy": "email",
        "preserveLength": false
      }
    ]
  },
  "sanitization": {
    "enableDefaultRules": true,
    "removeAnsiCodes": true
  }
}
```

### 4. API Fluent para Compliance
**Source:** `/Users/gabrielalejandrogomez/source/libs/syntropy/syntropyLog/src/logger/ILogger.ts`

**Methods to Implement:**
```typescript
// Retention rules (compliance)
withRetention(rules: LogRetentionRules): ILogger

// Transaction tracking
withTransactionId(transactionId: string): ILogger

// Source identification
withSource(source: string): ILogger
```

### 5. Reconfiguración en Caliente (Limited)
**Security Rules:**
- ❌ **NO** permitir cambiar reglas de masking existentes en caliente
- ✅ **SÍ** permitir agregar nuevas reglas de masking
- ✅ **SÍ** permitir cambiar nivel de log dinámicamente
- ✅ **SÍ** permitir cambiar transport dinámicamente
- ✅ **SÍ** permitir reconfigureLoggingMatrix() para campos de contexto

**Example API:**
```typescript
// Logger reconfigure method
reconfigure(options: {
  level?: LogLevel;
  transport?: Transport;
  addMaskingRule?: MaskingRule;  // Solo agregar, no modificar
}): void
```

## Implementation Priority

1. **HIGH:** SanitizationEngine - Prevenir code injection (crítico)
2. **HIGH:** MaskingEngine - Ofuscar datos sensibles (compliance)
3. **MEDIUM:** API Fluent - withRetention(), withTransactionId()
4. **MEDIUM:** Reconfiguración limitada en caliente
5. **LOW:** Validación JSON plano para configuración externa

## Dependencies to Add

```json
{
  "dependencies": {
    "regex-test": "^1.0.0",  // Para validación segura de regex
    "flatted": "^3.2.0"       // Para flattening JSON eficiente
  }
}
```

## Testing Requirements

- Test que verifica que objetos planos son procesados
- Test que verifica que instancias de clases NO son procesadas
- Test que verifica prevención de code injection (ANSI codes)
- Test que verifica ofuscación de credit cards, passwords, etc.
- Test que verifica que reglas existentes NO pueden ser modificadas
- Test que verifica que solo se pueden agregar nuevas reglas

## Migration Notes

- Los objetos no planos (clases, instancias) se devuelven sin modificar
- Esto protege las herramientas de logging y trazabilidad
- El sistema es seguro por defecto (fail-safe)


# Compliance & Security Features

## 📋 Quick Checklist

### ✅ Implemented Features

- [x] **MaskingEngine** - Ofuscación de datos sensibles (credit cards, SSN, emails, passwords, tokens)
- [x] **SanitizationEngine** - Prevención de code injection (filtro ANSI codes, solo objetos planos)
- [x] **LoggingMatrix** - Filtro de campos por nivel de log (prevenir campos sensibles en logs)
- [x] **Compliance Pipeline** - Integración completa (filter → sanitize → mask → log)
- [x] **Hot Reconfiguration** - Cambiar loggingMatrix en caliente
- [x] **Fast Path** - Sin compliance cuando contexto está deshabilitado (máximo rendimiento)

### 📋 Pending Features

- [ ] **API Fluent** - `withRetention()`, `withTransactionId()` (parcial: solo `withSource()`) - ✅ **COMPLETED**
- [x] **Regex ReDoS Validation** - Validación básica implementada ✅ | Opciones avanzadas (RE2/safe-regex) documentadas
- [ ] **Logger.reconfigure()** - Método unificado para reconfiguración en caliente
- [ ] **JSON Validation** - Validación de configuración JSON plano (prevenir code injection)
- [ ] **Tests** - Suite completa de tests para compliance features

---

## Overview

Sistema completo de compliance y seguridad basado en syntropylog, con ofuscación de datos sensibles, prevención de code injection, y configuración segura.

---

## ✅ Implemented Features

### ✅ 1. MaskingEngine (Ofuscación de Datos Sensibles) - COMPLETED
**Status:** ✅ Implementado y funcional  
**Location:** `src/masking/MaskingEngine.ts`

**Key Features:**
- ✅ Ofuscar datos sensibles automáticamente antes de escribir logs
- ✅ Reglas por defecto para:
  - Credit cards (`CREDIT_CARD`)
  - SSN (`SSN`)
  - Emails (`EMAIL`)
  - Phone numbers (`PHONE`)
  - Passwords (`PASSWORD`)
  - Tokens (`TOKEN`)
  - Custom patterns (`CUSTOM`)
- ✅ Solo permitir **agregar** nuevas reglas, NO modificar existentes en caliente (seguridad)
- ✅ Procesamiento recursivo de objetos anidados
- ⚠️ `regex-test` removido (no se usaba) - puede agregarse después si es necesario

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

**⚠️ Security Note:**
- ⚠️ **Validación ReDoS pendiente** - Actualmente NO se valida si los regex patterns son seguros (ReDoS attacks)
- ✅ Solo se permite **agregar** nuevas reglas (no modificar existentes) - reduce superficie de ataque
- 📋 **TODO:** Agregar validación con `safe-regex` o similar para prevenir ReDoS attacks
- 🔒 Los desarrolladores deben validar sus patterns antes de usar `addRule()`

### ✅ 2. SanitizationEngine (Prevención de Code Injection) - COMPLETED
**Status:** ✅ Implementado y funcional  
**Location:** `src/sanitization/SanitizationEngine.ts`

**Key Features:**
- ✅ Procesar **SOLO objetos planos** usando `data.constructor === Object`
- ✅ Filtro ANSI escape codes: `/[\x1b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g`
- ✅ NO procesar clases, instancias, o objetos especiales
- ✅ Prevenir log injection attacks que podrían explotar vulnerabilidades de terminal
- ✅ Integrar con MaskingEngine para ofuscación

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

### ✅ 3. LoggingMatrix (Filtro de Campos por Nivel) - COMPLETED
**Status:** ✅ Implementado y funcional  
**Location:** `src/compliance/LoggingMatrix.ts`

**Key Features:**
- ✅ Control de qué campos del contexto se incluyen por nivel de log
- ✅ Prevenir que campos sensibles (api_key, headers, etc.) aparezcan en logs
- ✅ Soporte para wildcard `['*']` para incluir todos los campos
- ✅ Case-insensitive matching
- ✅ Hot reconfiguration con `reconfigure()`
- ✅ Integrado con el pipeline de compliance

**Implementation:**
```typescript
type LoggingMatrix = Partial<Record<LogLevel | 'default', string[]>>;

// Example:
const matrix: LoggingMatrix = {
  default: ['correlationId'], // Solo correlationId por defecto
  info: ['correlationId', 'userId'], // + userId para info
  error: ['*'] // Todos los campos para errores
};
```

### ✅ 4. Pipeline de Compliance Integrado - COMPLETED
**Status:** ✅ Implementado y funcional  
**Location:** `src/Logger.ts`

**Pipeline Flow:**
1. Recopilar context + bindings + metadata
2. **Aplicar LoggingMatrix filter** (solo campos permitidos por nivel)
3. **Aplicar SanitizationEngine** (filtro ANSI codes + solo objetos planos)
4. **Aplicar MaskingEngine** (ofuscar datos sensibles)
5. Construir JSON y escribir a transport

**Activation:**
- Solo se activa si `useAsyncContext = true` Y `sanitizationEngine` está configurado
- Si contexto está deshabilitado → fast path sin compliance (máximo rendimiento)

---

## Usage Example

```typescript
import { 
  createLogger, 
  MaskingEngine, 
  SanitizationEngine,
  type LoggingMatrix 
} from '@syntrojs/logger';

// Setup compliance engines
const maskingEngine = new MaskingEngine({
  enableDefaultRules: true,
  maskChar: '*',
  preserveLength: true
});

const sanitizationEngine = new SanitizationEngine(maskingEngine);

// Configure logging matrix to filter sensitive fields
const loggingMatrix: LoggingMatrix = {
  default: ['correlationId'], // Solo correlationId por defecto
  info: ['correlationId', 'userId', 'requestId'], // Campos específicos para info
  error: ['*'] // Todos los campos para errores (debugging completo)
};

// Create logger with compliance
const logger = createLogger({
  name: 'my-api',
  level: 'info',
  sanitizationEngine,
  loggingMatrix,
  useAsyncContext: true // Required for compliance pipeline
});

// Los campos sensibles (api_key, headers, etc.) NO aparecerán en logs
// a menos que estén explícitamente permitidos en la matrix
logger.info({ 
  userId: 123,
  api_key: 'secret123', // Será filtrado por loggingMatrix
  password: 'pwd123',    // Será ofuscado por MaskingEngine
  correlationId: 'abc-123' // Permitido y visible
}, 'User action');
```

**Note on LogRetentionRules:** Values can be numbers (seconds), strings (policy codes like 'BANK-RET-2024-A', 'HIPAA-compliant-7years'), or any JSON-compatible value. This allows maximum flexibility for different compliance frameworks (banking, healthcare, etc.).

---

## 📋 Pending Features

### 📋 8. JSON Plano para Configuración de Compliance

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

### ✅ 5. API Fluent para Compliance - COMPLETED
**Status:** ✅ Implementado en `Logger.ts`

**Methods:**
```typescript
// Retention rules (compliance) - ✅ Implementado
withRetention(rules: LogRetentionRules): Logger

// Transaction tracking - ✅ Implementado
withTransactionId(transactionId: string): Logger

// Source identification - ✅ Implementado
withSource(source: string): Logger
```

### 📋 6. Validación ReDoS para Regex Patterns
**Status:** ⚠️ Pendiente - Crítico para seguridad  
**Location:** `src/masking/MaskingEngine.ts` - método `addRule()`

**Security Issue:**
- Actualmente `addRule()` NO valida si los regex patterns son seguros
- Permite patterns maliciosos que podrían causar ReDoS attacks (Regular Expression Denial of Service)
- Un pattern como `(a+)+$` con input `aaaaaaaaaaaaaaaaaaaaaaac` puede causar catastrophic backtracking

**Solution:**
- Agregar validación usando `safe-regex` o `recheck` package
- Validar patterns antes de compilarlos
- Rechazar patterns inseguros con mensaje de error claro
- Permitir bypass para desarrolladores que realmente necesiten patterns complejos (flag de desarrollo)

**Status:** ✅ Implementado con validación básica

**Implementation:**
- ✅ Validación básica implementada en `isSafeRegex()`
- ✅ Detecta patrones comunes de ReDoS (nested quantifiers, exponential backtracking)
- ⚠️ Opciones futuras: RE2 (máxima seguridad) o `safe-regex` (middle ground)

**Ver:** `docs/REGEX_SECURITY_OPTIONS.md` para análisis completo de opciones (RE2, safe-regex, etc.)

**Current Implementation:**
```typescript
function isSafeRegex(pattern: string | RegExp): boolean {
  // Detecta: nested quantifiers, exponential backtracking, etc.
  // Lanza error si el pattern es peligroso
}

public addRule(rule: MaskingRule): void {
  if (!isSafeRegex(rule.pattern)) {
    throw new Error('Unsafe regex pattern - could cause ReDoS attacks');
  }
  // Continue...
}
```

**Options Considered:**
1. ✅ **Validación básica (actual)** - Sin dependencias, detecta casos comunes
2. **RE2 (Google)** - Máxima seguridad, pero requiere bindings nativos
3. **safe-regex package** - Middle ground, validación más robusta

**Priority:** ✅ COMPLETED (básica) | 🔴 FUTURE: Considerar RE2 o safe-regex como opción avanzada

### 📋 7. Reconfiguración en Caliente (Limited)
**Status:** Parcialmente implementado

**Already Implemented:**
- ✅ `FieldFilter.reconfigure()` - Cambiar loggingMatrix en caliente
- ✅ `Logger.setLevel()` - Cambiar nivel de log dinámicamente
- ✅ Agregar nuevas reglas de masking (`MaskingEngine.addRule()`)

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

---

## Implementation Priority

### ✅ Completed (HIGH Priority)
1. ✅ **HIGH:** SanitizationEngine - Prevenir code injection (crítico)
2. ✅ **HIGH:** MaskingEngine - Ofuscar datos sensibles (compliance)
3. ✅ **HIGH:** LoggingMatrix - Filtrar campos sensibles por nivel
4. ✅ **HIGH:** Compliance Pipeline - Integración completa

### 📋 Remaining (MEDIUM/LOW Priority)
5. ✅ **HIGH:** API Fluent - withRetention(), withTransactionId() - **COMPLETED**
6. 🔴 **HIGH:** Regex ReDoS Validation - Validar patterns antes de agregar reglas (CRÍTICO - Security vulnerability)
7. **MEDIUM:** Reconfiguración limitada en caliente (parcial)
8. **LOW:** Validación JSON plano para configuración externa

---

## Dependencies

```json
{
  "dependencies": {
    "chalk": "^5.3.0"
  },
  "optionalDependencies": {
    "pino": "^10.1.0"
  }
}
```

**Note:** 
- `regex-test` y `flatted` fueron removidos porque no se usaban actualmente
- `safe-regex` debería agregarse como dependencia para validación ReDoS en `MaskingEngine.addRule()`

---

## Testing Requirements

### ✅ Tests Needed
- Test que verifica que objetos planos son procesados
- Test que verifica que instancias de clases NO son procesadas
- Test que verifica prevención de code injection (ANSI codes)
- Test que verifica ofuscación de credit cards, passwords, etc.
- Test que verifica que reglas existentes NO pueden ser modificadas
- Test que verifica que solo se pueden agregar nuevas reglas
- Test que verifica que patterns de regex peligrosos (ReDoS) son rechazados
- Test que verifica validación de `safe-regex` en `addRule()`
- Test que verifica LoggingMatrix filtra campos correctamente por nivel
- Test que verifica pipeline de compliance se activa solo con contexto habilitado
- Test que verifica fast path (sin compliance) cuando contexto está deshabilitado

---

## Migration Notes

- Los objetos no planos (clases, instancias) se devuelven sin modificar
- Esto protege las herramientas de logging y trazabilidad
- El sistema es seguro por defecto (fail-safe)
- El pipeline de compliance solo se activa si `useAsyncContext = true` y `sanitizationEngine` está configurado
- Si `useAsyncContext = false`, se usa fast path sin compliance para máximo rendimiento

---

## Architecture Notes

### Compliance Pipeline Flow

```
Logger.log()
  ↓
1. Collect: context + bindings + metadata
  ↓
2. Filter (if fieldFilter exists): Apply LoggingMatrix → only allowed fields
  ↓
3. Sanitize (if sanitizationEngine exists): 
   - Remove ANSI codes
   - Process only plain objects (data.constructor === Object)
  ↓
4. Mask (if maskingEngine in sanitizationEngine):
   - Apply masking rules to sensitive fields
  ↓
5. Build JSON string manually (Pino-style)
  ↓
6. Write to transport
```

### Performance Considerations

- **Fast Path:** Si `useAsyncContext = false` → No compliance processing (máxima velocidad)
- **Compliance Path:** Si `useAsyncContext = true` y `sanitizationEngine` configurado → Full pipeline
- **Field Filtering:** Aplicado ANTES de sanitization/masking para reducir procesamiento
- **Context Filtering:** Solo se filtra el contexto, bindings y metadata pasan directo

# Regex Security Options - ReDoS Prevention

## Overview

Para prevenir ataques ReDoS (Regular Expression Denial of Service) en `MaskingEngine.addRule()`, tenemos varias opciones:

## Option 1: Validación Básica (Actual)

**Status:** ✅ Implementado

**Ventajas:**
- ✅ Sin dependencias externas
- ✅ Detecta patrones comunes de ReDoS
- ✅ Zero runtime overhead adicional (solo valida al agregar reglas)
- ✅ Fácil de mantener y entender

**Desventajas:**
- ⚠️ No detecta todos los casos de ReDoS
- ⚠️ Basado en heurísticas y patrones conocidos
- ⚠️ Puede tener falsos positivos/negativos

**Implementación actual:**
```typescript
function isSafeRegex(pattern: string | RegExp): boolean {
  // Detecta patrones peligrosos:
  // - Nested quantifiers: (a+)+, (a*)*
  // - Exponential backtracking: (a|a)*
  // - Repetition with alternation
}
```

## Option 2: RE2 (Google's Safe Regex Engine)

**Status:** ⚠️ Requiere bindings para JavaScript

**Ventajas:**
- ✅ **Máxima seguridad:** Previene ReDoS por diseño (sin backtracking)
- ✅ Garantía de tiempo de ejecución lineal
- ✅ Probado en producción por Google desde 2006
- ✅ Open source (Apache 2.0)

**Desventajas:**
- ⚠️ Requiere bindings nativos (C++)
- ⚠️ No soporta todas las features de JavaScript regex (backreferences, lookahead, etc.)
- ⚠️ Posible overhead de instalación/build
- ⚠️ Puede romper compatibilidad con patterns existentes

**Paquetes npm disponibles:**
- `re2` - Binding nativo para Node.js (requiere compilación)
- `re2wasm` - Implementación WebAssembly (más portable)

**Uso propuesto:**
```typescript
import RE2 from 're2';

public addRule(rule: MaskingRule): void {
  // Validar con RE2 antes de usar
  try {
    const re2Pattern = new RE2(rule.pattern);
    // Si RE2 puede compilarlo, es seguro
    rule._compiledPattern = re2Pattern;
  } catch (error) {
    throw new Error(`Unsafe regex pattern: ${error.message}`);
  }
}
```

## Option 3: safe-regex Package

**Status:** ⚠️ Paquete npm simple pero limitado

**Ventajas:**
- ✅ Librería ligera y simple
- ✅ Validación rápida
- ✅ Sin dependencias nativas

**Desventajas:**
- ⚠️ Menos robusta que RE2
- ⚠️ Basada en análisis estático (puede tener falsos positivos)
- ⚠️ Proyecto puede estar menos mantenido

**Uso propuesto:**
```typescript
import safeRegex from 'safe-regex';

public addRule(rule: MaskingRule): void {
  if (!safeRegex(rule.pattern)) {
    throw new Error('Unsafe regex pattern detected');
  }
  // Continue...
}
```

## Option 4: regexp-tree (Análisis de AST)

**Status:** ⚠️ Más complejo pero más preciso

**Ventajas:**
- ✅ Análisis más profundo del AST del regex
- ✅ Puede detectar más casos de ReDoS
- ✅ Permite transformaciones y optimizaciones

**Desventajas:**
- ⚠️ Más pesado (análisis de AST)
- ⚠️ Dependencia más grande
- ⚠️ Overhead en validación

## Recomendación

Para `@syntrojs/logger`, recomendamos:

1. ✅ **IMPLEMENTADO: Estrategia Híbrida**
   - `safe-regex` como `optionalDependency`
   - Si está instalado → usa `safe-regex` (validación robusta)
   - Si no está instalado → usa validación básica (sin dependencias)
   - Usuarios pueden optar por más validación sin forzarla

2. **Corto plazo (actual):**
   - Validación básica por defecto (zero dependencies)
   - `safe-regex` opcional para usuarios que lo instalen
   - Funciona en ambos casos

3. **Largo plazo:** Evaluar RE2 solo si:
   - Los usuarios necesitan procesar regex de fuentes no confiables frecuentemente
   - El costo de bindings nativos es aceptable
   - La incompatibilidad con features de JavaScript regex es aceptable

## ✅ Implementación Híbrida (IMPLEMENTADO)

```typescript
function isSafeRegex(pattern: string | RegExp): boolean {
  // Try safe-regex first (if available)
  try {
    const safeRegex = require('safe-regex');
    const patternToCheck = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    return safeRegex(patternToCheck);
  } catch {
    // safe-regex not available, fallback to basic validation
  }
  
  // Fallback: Basic validation
  return isSafeRegexBasic(pattern);
}
```

**Status:** ✅ Implementado y funcional

**Uso:**
```bash
# Sin safe-regex (usa validación básica)
npm install @syntrojs/logger

# Con safe-regex (validación robusta)
npm install @syntrojs/logger safe-regex
```

Esto permite:
- ✅ Usuarios pueden optar por más validación instalando `safe-regex`
- ✅ Funciona sin dependencias adicionales por defecto
- ✅ Zero overhead si `safe-regex` no está instalado
- ✅ Validación más robusta si el usuario instala `safe-regex`
- ✅ Fácil de actualizar a RE2 en el futuro si es necesario

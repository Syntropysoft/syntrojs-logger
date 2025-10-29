/**
 * Serialization utilities for complex objects
 * * Handles errors, circular references, dates, and other edge cases
 */

import type { JsonValue } from '../types';

export interface SerializableValue {
  [key: string]: unknown;
}

/**
 * Internal recursive function that handles object tracking for circularity.
 * It takes the 'seen' WeakSet to propagate it across the entire object graph.
 */
function _serialize(obj: unknown, seen: WeakSet<object>): JsonValue {
  // --- Paso 1: Manejar null/undefined y primitivos ---
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  // --- Paso 2: Manejar Clases Especiales (no circulares) ---
  
  // Handle Date
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    return { source: obj.source, flags: obj.flags };
  }

  // Handle Error objects
  if (obj instanceof Error) {
    const error: SerializableValue = {
      message: obj.message,
      name: obj.name,
      stack: obj.stack,
    };
    
    // Add custom properties (functional approach - preserves immutability)
    // Optimization: Create exclusion Set for O(1) lookups
    const excludedProps = new Set(['message', 'name', 'stack']);
    const props = Object.getOwnPropertyNames(obj);
    const customProps = props
      .filter(prop => !excludedProps.has(prop))
      .reduce<Record<string, unknown>>((acc, prop) => {
        acc[prop] = _serialize((obj as any)[prop], seen);
        return acc;
      }, {});
    
    return { ...error, ...customProps };
  }

  // --- Paso 3: Manejar Referencias Circulares (solo objetos que se agregan a WeakSet) ---
  if (seen.has(obj)) {
    return '[Circular]';
  }
  seen.add(obj);

  // --- Paso 4: Manejar Arrays ---
  if (Array.isArray(obj)) {
    try {
      // Propagar el WeakSet
      return obj.map(item => _serialize(item, seen)); 
    } catch {
      return '[Circular]';
    } finally {
      seen.delete(obj); // Liberar referencia al salir
    }
  }

  // --- Paso 5: Manejar Objetos Planos (functional approach) ---
  const result = Object.entries(obj as Record<string, unknown>)
    .reduce<SerializableValue>((acc, [key, value]) => {
      try {
        // Propagar el WeakSet
        acc[key] = _serialize(value, seen);
      } catch {
        acc[key] = '[Unable to serialize]';
      }
      return acc;
    }, {});

  seen.delete(obj); // Liberar referencia al salir
  return result;
}


/**
 * Serialize complex objects to plain objects
 * Handles Errors, Dates, circular references, etc.
 */
export function serialize(obj: unknown): JsonValue {
  // Punto de entrada: inicializa el WeakSet si es un objeto
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  return _serialize(obj, new WeakSet<object>());
}

/**
 * Safely stringify objects, handling circular references
 */
export function safeStringify(obj: unknown): string {
  try {
    // Utiliza 'serialize' como punto de entrada
    return JSON.stringify(serialize(obj), null, 2);
  } catch {
    return String(obj);
  }
}


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
    
    // Add custom properties (recursive call with same WeakSet)
    const props = Object.getOwnPropertyNames(obj);
    for (const prop of props) {
      if (!['message', 'name', 'stack'].includes(prop)) {
        error[prop] = _serialize((obj as any)[prop], seen); 
      }
    }
    return error;
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

  // --- Paso 5: Manejar Objetos Planos ---
  const result: SerializableValue = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    try {
      // Propagar el WeakSet
      result[key] = _serialize(value, seen);
    } catch {
      result[key] = '[Unable to serialize]';
    }
  }

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


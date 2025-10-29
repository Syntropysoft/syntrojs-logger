/**
 * JSON Validation Utility
 * 
 * Validates that configuration data is plain JSON (no functions, classes, code injection).
 * Uses guard clauses and functional programming for security.
 * 
 * Prevents code injection in external configurations.
 */

/**
 * Type guard: Check if value is a plain object (not a class instance).
 * @private
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  
  // Guard clause: Plain object constructor check
  return value.constructor === Object;
}

/**
 * Type guard: Check if value is a valid JSON primitive.
 * @private
 */
function isValidJsonPrimitive(value: unknown): boolean {
  // Guard clause: Valid primitives
  if (value === null) return true;
  if (typeof value === 'string') return true;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  
  return false;
}

/**
 * Recursively validates that data is plain JSON (no functions, classes, code).
 * Uses guard clauses and functional programming.
 * 
 * @param data - Data to validate
 * @param path - Current path for error messages (for debugging)
 * @returns true if valid, throws Error if invalid
 * @throws Error if data contains non-JSON values (functions, classes, etc.)
 */
export function validatePlainJson(
  data: unknown,
  path: string = 'root'
): void {
  // Guard clause: Primitives are always valid
  if (isValidJsonPrimitive(data)) {
    return;
  }

  // Guard clause: Array - validate each element (functional approach)
  if (Array.isArray(data)) {
    // Functional validation: validate all elements (forEach is appropriate for validation)
    data.forEach((item, index) => {
      validatePlainJson(item, `${path}[${index}]`);
    });
    return;
  }

  // Guard clause: Plain object - validate recursively (functional approach)
  if (isPlainObject(data)) {
    // Functional validation: validate all keys (forEach is appropriate for validation)
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      // Guard clause: Check for functions (code injection risk)
      if (typeof value === 'function') {
        throw new Error(
          `[JSON Validation] Function found at ${path}.${key}. ` +
          `JSON configuration must be plain data only (no functions, classes, or code).`
        );
      }
      
      // Guard clause: Check for class instances (code injection risk)
      if (
        typeof value === 'object' 
        && value !== null 
        && value.constructor !== Object
      ) {
        throw new Error(
          `[JSON Validation] Class instance found at ${path}.${key}. ` +
          `JSON configuration must be plain objects only (no class instances).`
        );
      }
      
      // Recursive validation
      validatePlainJson(value, `${path}.${key}`);
    });
    return;
  }

  // Guard clause: Unexpected type
  throw new Error(
    `[JSON Validation] Invalid type at ${path}: ${typeof data}. ` +
    `Only plain JSON (objects, arrays, primitives) are allowed.`
  );
}

/**
 * Validates and sanitizes JSON configuration.
 * Returns a safe copy of the data (immutable).
 * 
 * @param data - Configuration data to validate
 * @returns Safe copy of the data (throws if invalid)
 * @throws Error if data contains non-JSON values
 * 
 * @example
 * ```typescript
 * try {
 *   const safeConfig = validateAndSanitizeJson(externalConfig);
 *   // Use safeConfig...
 * } catch (error) {
 *   console.error('Invalid configuration:', error);
 * }
 * ```
 */
export function validateAndSanitizeJson(data: unknown): unknown {
  // Validate first (throws if invalid)
  validatePlainJson(data);
  
  // Return deep copy (immutable)
  return JSON.parse(JSON.stringify(data));
}

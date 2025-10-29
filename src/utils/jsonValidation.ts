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
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  // Guard clause: Plain object constructor check
  return value.constructor === Object;
}

/**
 * Type guard: Check if value is a valid JSON primitive.
 */
export function isValidJsonPrimitive(value: unknown): boolean {
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
export function validatePlainJson(data: unknown, path = 'root'): void {
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
    Object.keys(data).forEach((key) => {
      const value = data[key];

      // Guard clause: Check for functions (code injection risk)
      if (typeof value === 'function') {
        throw new Error(
          `[JSON Validation] Function found at ${path}.${key}. JSON configuration must be plain data only (no functions, classes, or code).`
        );
      }

      // Guard clause: Check for class instances (code injection risk)
      if (typeof value === 'object' && value !== null && value.constructor !== Object) {
        throw new Error(
          `[JSON Validation] Class instance found at ${path}.${key}. JSON configuration must be plain objects only (no class instances).`
        );
      }

      // Recursive validation
      validatePlainJson(value, `${path}.${key}`);
    });
    return;
  }

  // Guard clause: Unexpected type
  throw new Error(
    `[JSON Validation] Invalid type at ${path}: ${typeof data}. Only plain JSON (objects, arrays, primitives) are allowed.`
  );
}

/**
 * Validates and sanitizes JSON configuration.
 * Returns a safe copy of the data with invalid properties removed (immutable).
 *
 * @param data - Configuration data to sanitize
 * @returns Safe copy of the data with invalid properties removed
 *
 * @example
 * ```typescript
 * const safeConfig = validateAndSanitizeJson(externalConfig);
 * // SafeConfig will have all invalid properties (functions, classes) removed
 * ```
 */
export function validateAndSanitizeJson(data: unknown): unknown {
  // Guard clause: Primitives are safe as-is
  if (isValidJsonPrimitive(data)) {
    return data;
  }

  // Guard clause: Arrays - filter invalid elements (functional approach)
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        // Check if item is invalid before sanitizing
        if (typeof item === 'function') return undefined; // Mark for removal
        if (
          typeof item === 'object' &&
          item !== null &&
          item.constructor !== Object &&
          !Array.isArray(item)
        ) {
          return undefined; // Mark for removal
        }
        if (item === undefined) return undefined; // Mark for removal
        // Sanitize valid items (including null)
        return validateAndSanitizeJson(item);
      })
      .filter((item) => item !== undefined); // Remove invalid items, keep null if it was originally null
  }

  // Guard clause: Plain objects - recursively sanitize (functional approach)
  if (isPlainObject(data)) {
    return Object.keys(data)
      .filter((key) => {
        const value = data[key];
        // Filter out invalid values
        if (typeof value === 'function') return false;
        if (
          typeof value === 'object' &&
          value !== null &&
          value.constructor !== Object &&
          !Array.isArray(value)
        ) {
          return false;
        }
        if (value === undefined) return false;
        return true;
      })
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = validateAndSanitizeJson(data[key]);
        return acc;
      }, {});
  }

  // Invalid type - return null (safe default)
  return null;
}

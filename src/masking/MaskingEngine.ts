/**
 * FILE: src/masking/MaskingEngine.ts
 * DESCRIPTION: Ultra-fast data masking engine using JSON flattening strategy.
 *
 * This engine processes nested objects recursively, applying masking rules
 * to sensitive data fields based on pattern matching.
 */

/**
 * Basic regex validation for ReDoS prevention.
 * Used as fallback when safe-regex is not available.
 */
function isSafeRegexBasic(pattern: string | RegExp): boolean {
  const patternStr = pattern instanceof RegExp ? pattern.source : pattern;

  // Empty pattern is safe
  if (!patternStr) return true;

  // Patterns that commonly cause ReDoS (catastrophic backtracking)
  const dangerousPatterns = [
    // Nested quantifiers: (a+)+, (a*)*, (a?)+, etc.
    /\([^)]*\+(?:\+|\*|\?)\)[\+\*]/,
    /\([^)]*\*(?:\+|\*|\?)\)[\+\*]/,
    /\([^)]*\?(?:\+|\*|\?)\)[\+\*]/,

    // Quantifier on quantifier: ++, **, ?+, etc.
    /[\+\*]\s*[\+\*]/,
    /\?\s*[\+\*]/,

    // Complex nested alternations that can cause exponential backtracking
    // Pattern like: (a|ab)+ or (a|a)*
    /\([^)]*\|\s*\w+\+\s*\|\s*\w+\)[\+\*]/,

    // Repetition followed by complex alternation
    /\([^)]*\)[\+\*]\s*[\(\)\|\+\*]{5,}/,
  ];

  // Functional approach: Check for dangerous patterns using some()
  const hasDangerousPattern = dangerousPatterns.some((pattern) => pattern.test(patternStr));

  // Guard clause: Dangerous pattern found
  if (hasDangerousPattern) {
    return false;
  }

  // Guard clause: Count nested groups with quantifiers (heuristic)
  // Patterns with many nested quantifiers are suspicious
  const nestedQuantifierMatches = patternStr.match(/\([^)]*[\+\*]\?\)[\+\*]/g);
  if (nestedQuantifierMatches && nestedQuantifierMatches.length > 2) {
    return false; // Too many nested quantifiers = potentially dangerous
  }

  // Guard clause: Check for exponential backtracking patterns
  // Pattern like: (a|a)+ or (a|aa)+ with repetition
  if (/\([^)]*\|\s*[^)]+\)[\+\*]{2,}/.test(patternStr)) {
    return false;
  }

  // All checks passed - pattern is safe
  return true;
}

/**
 * Validates if a regex pattern is safe from ReDoS (Regular Expression Denial of Service) attacks.
 *
 * Uses hybrid approach:
 * 1. Tries to use `safe-regex` package if available (optional dependency)
 * 2. Falls back to basic validation if `safe-regex` is not installed
 *
 * This allows users to opt-in for more robust validation by installing `safe-regex`,
 * while still providing protection without additional dependencies.
 *
 * @param pattern - Regex pattern as string or RegExp object
 * @returns true if pattern appears safe, false if potentially dangerous
 */
function isSafeRegex(pattern: string | RegExp): boolean {
  // Try to use safe-regex if available (optional dependency)
  try {
    // Use dynamic import to avoid breaking if package is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const safeRegex = require('safe-regex');

    if (typeof safeRegex === 'function') {
      // safe-regex is a function
      const patternToCheck = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      return safeRegex(patternToCheck);
    }
    if (typeof safeRegex.default === 'function') {
      // safe-regex has default export
      const patternToCheck = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      return safeRegex.default(patternToCheck);
    }
  } catch {
    // safe-regex not available, continue to fallback
  }

  // Fallback: Use basic validation
  return isSafeRegexBasic(pattern);
}

/**
 * @enum MaskingStrategy
 * @description Different masking strategies for various data types.
 */
export enum MaskingStrategy {
  CREDIT_CARD = 'credit_card',
  SSN = 'ssn',
  EMAIL = 'email',
  PHONE = 'phone',
  PASSWORD = 'password',
  TOKEN = 'token',
  CUSTOM = 'custom',
}

/**
 * @interface MaskingRule
 * @description Configuration for a masking rule.
 */
export interface MaskingRule {
  /** Regex pattern to match field names */
  pattern: string | RegExp;
  /** Masking strategy to apply */
  strategy: MaskingStrategy;
  /** Custom masking function (for CUSTOM strategy) */
  customMask?: (value: string) => string;
  /** Whether to preserve original length */
  preserveLength?: boolean;
  /** Character to use for masking */
  maskChar?: string;
  /** Compiled regex pattern for performance */
  _compiledPattern?: RegExp;
}

/**
 * @interface MaskingEngineOptions
 * @description Options for configuring the MaskingEngine.
 */
export interface MaskingEngineOptions {
  /** Array of masking rules */
  rules?: MaskingRule[];
  /** Default mask character */
  maskChar?: string;
  /** Whether to preserve original length by default */
  preserveLength?: boolean;
  /** Enable default rules for common data types */
  enableDefaultRules?: boolean;
}

/**
 * @class MaskingEngine
 * Ultra-fast data masking engine.
 *
 * Processes nested objects recursively and applies masking rules
 * to sensitive data fields based on pattern matching.
 */
export class MaskingEngine {
  /** @private Array of masking rules */
  private rules: MaskingRule[] = [];
  /** @private Default mask character */
  private readonly maskChar: string;
  /** @private Whether to preserve original length by default */
  private readonly preserveLength: boolean;
  /** @private Whether the engine is initialized */
  private initialized = false;
  /** @private Strategy map: Dictionary of masking functions (functional approach) */
  private readonly strategyMap: Map<MaskingStrategy, (value: string, rule: MaskingRule) => string>;

  constructor(options?: MaskingEngineOptions) {
    // Functional approach: Nullish coalescing for defaults
    this.maskChar = options?.maskChar ?? '*';
    this.preserveLength = options?.preserveLength ?? true; // Default to true for security

    // Initialize strategy map (functional approach: dictionary instead of switch)
    this.strategyMap = this.initializeStrategyMap();

    // Guard clause: Add default rules if enabled
    if (options?.enableDefaultRules !== false) {
      this.addDefaultRules();
    }

    // Functional approach: Add custom rules from options (guard clause pattern)
    options?.rules?.forEach((rule) => {
      this.addRule(rule);
    });
  }

  /**
   * Adds default masking rules for common data types.
   * @private
   */
  private addDefaultRules(): void {
    const defaultRules: MaskingRule[] = [
      {
        pattern: /credit_card|card_number|payment_number/i,
        strategy: MaskingStrategy.CREDIT_CARD,
        preserveLength: false, // Use fixed format for default rule
        maskChar: this.maskChar,
      },
      {
        pattern: /ssn|social_security|security_number/i,
        strategy: MaskingStrategy.SSN,
        preserveLength: true,
        maskChar: this.maskChar,
      },
      {
        pattern: /email/i,
        strategy: MaskingStrategy.EMAIL,
        preserveLength: true,
        maskChar: this.maskChar,
      },
      {
        pattern: /phone|phone_number|mobile_number/i,
        strategy: MaskingStrategy.PHONE,
        preserveLength: true,
        maskChar: this.maskChar,
      },
      {
        pattern: /password|pass|pwd|secret/i,
        strategy: MaskingStrategy.PASSWORD,
        preserveLength: true,
        maskChar: this.maskChar,
      },
      {
        pattern: /token|api_key|auth_token|jwt|bearer/i,
        strategy: MaskingStrategy.TOKEN,
        preserveLength: true,
        maskChar: this.maskChar,
      },
    ];

    // Functional approach: add all default rules
    defaultRules.forEach((rule) => {
      this.addRule(rule);
    });
  }

  /**
   * Adds a custom masking rule.
   * IMPORTANT: This only allows ADDING rules, not modifying existing ones for security.
   * @param rule - The masking rule to add
   */
  public addRule(rule: MaskingRule): void {
    // Validate regex to prevent ReDoS attacks
    // Uses safe-regex if available (optional dependency), otherwise uses basic validation
    if (!isSafeRegex(rule.pattern)) {
      const patternStr =
        rule.pattern instanceof RegExp ? rule.pattern.source : String(rule.pattern);

      // Check if safe-regex is available to provide more specific error
      let validationMethod = 'basic validation';
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('safe-regex');
        validationMethod = 'safe-regex';
      } catch {
        // safe-regex not available, using basic validation
      }

      throw new Error(
        `[MaskingEngine] Unsafe regex pattern detected: "${patternStr}". This pattern could cause ReDoS (Regular Expression Denial of Service) attacks. Please review and simplify the pattern to avoid nested quantifiers and exponential backtracking. (Validated using: ${validationMethod})`
      );
    }

    // Functional approach: Compile regex pattern (guard clause pattern)
    rule._compiledPattern =
      typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'i') : rule.pattern;

    // Functional approach: Set defaults using nullish coalescing
    rule.preserveLength = rule.preserveLength ?? this.preserveLength;
    rule.maskChar = rule.maskChar ?? this.maskChar;

    this.rules.push(rule);
  }

  /**
   * Processes a metadata object and applies the configured masking rules.
   * @param meta - The metadata object to process
   * @returns A new object with the masked data
   */
  public process(meta: Record<string, unknown>): Record<string, unknown> {
    // Set initialized flag on first use
    if (!this.initialized) {
      this.initialized = true;
    }

    try {
      // Apply masking rules directly to the data structure
      const masked = this.applyMaskingRules(meta);

      // Return the masked data (ensure it's a Record)
      return typeof masked === 'object' && masked !== null && !Array.isArray(masked)
        ? (masked as Record<string, unknown>)
        : meta;
    } catch (_error) {
      // Silent observer - return original data if masking fails
      return meta;
    }
  }

  /**
   * Applies masking rules to data recursively.
   * Uses functional programming and guard clauses for better maintainability.
   * @param data - Data to mask
   * @returns Masked data
   * @private
   */
  private applyMaskingRules(data: unknown): unknown {
    // Guard clause: Primitive or null - return as-is
    if (data === null || typeof data !== 'object') {
      return data;
    }

    // Guard clause: Array - use functional map
    if (Array.isArray(data)) {
      return data.map((item) => this.applyMaskingRules(item));
    }

    // Functional approach: use Object.keys + reduce for immutability
    // Type guard: ensure data is a plain object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return data;
    }
    const dataRecord = data as Record<string, unknown>;
    return Object.keys(dataRecord)
      .filter((key) => Object.prototype.hasOwnProperty.call(dataRecord, key))
      .reduce<Record<string, unknown>>((masked, key) => {
        const value = dataRecord[key];

        // Guard clause: String value - apply masking rules
        if (typeof value === 'string') {
          const matchingRule = this.findMatchingRule(key);
          masked[key] = matchingRule ? this.applyStrategy(value, matchingRule) : value;
          return masked;
        }

        // Guard clause: Nested object - recursive masking
        if (typeof value === 'object' && value !== null) {
          masked[key] = this.applyMaskingRules(value);
          return masked;
        }

        // Guard clause: Other types - keep as-is
        masked[key] = value;
        return masked;
      }, {});
  }

  /**
   * Find first matching masking rule for a key.
   * Single Responsibility: Only finds matching rules.
   * @param key - Field key to check
   * @returns Matching rule or undefined
   * @private
   */
  private findMatchingRule(key: string): MaskingRule | undefined {
    return this.rules.find((rule) => rule._compiledPattern?.test(key));
  }

  /**
   * Initialize strategy map with all masking functions.
   * Functional approach: Data dictionary instead of switch statements.
   * Pure functions stored in a Map for O(1) lookup.
   *
   * @returns Map of strategy enum to masking function
   * @private
   */
  private initializeStrategyMap(): Map<
    MaskingStrategy,
    (value: string, rule: MaskingRule) => string
  > {
    const strategies = new Map<MaskingStrategy, (value: string, rule: MaskingRule) => string>();

    // Pure functions: Each strategy is a function that can be stored in a map
    strategies.set(MaskingStrategy.CREDIT_CARD, (value, rule) => this.maskCreditCard(value, rule));
    strategies.set(MaskingStrategy.SSN, (value, rule) => this.maskSSN(value, rule));
    strategies.set(MaskingStrategy.EMAIL, (value, rule) => this.maskEmail(value, rule));
    strategies.set(MaskingStrategy.PHONE, (value, rule) => this.maskPhone(value, rule));
    strategies.set(MaskingStrategy.PASSWORD, (value, rule) => this.maskPassword(value, rule));
    strategies.set(MaskingStrategy.TOKEN, (value, rule) => this.maskToken(value, rule));

    return strategies;
  }

  /**
   * Applies specific masking strategy to a value.
   * Functional approach: Uses dictionary lookup instead of switch statement.
   * Pure function pattern: No side effects, predictable output.
   * Single Responsibility: Only applies masking strategies.
   *
   * @param value - Value to mask
   * @param rule - Masking rule to apply
   * @returns Masked value
   * @private
   */
  private applyStrategy(value: string, rule: MaskingRule): string {
    // Guard clause: Custom mask strategy (highest priority)
    if (rule.strategy === MaskingStrategy.CUSTOM && rule.customMask) {
      return rule.customMask(value);
    }

    // Functional approach: Dictionary lookup instead of switch
    const masker = this.strategyMap.get(rule.strategy);

    // Guard clause: Strategy not found, use default
    if (!masker) {
      return this.maskDefault(value, rule);
    }

    // Apply strategy function (functional composition)
    return masker(value, rule);
  }

  /**
   * Masks credit card number.
   * Uses guard clause pattern for preserveLength option.
   * Single Responsibility: Only masks credit cards.
   *
   * @param value - Credit card number
   * @param rule - Masking rule
   * @returns Masked credit card
   * @private
   */
  private maskCreditCard(value: string, rule: MaskingRule): string {
    const clean = value.replace(/\D/g, '');
    const maskChar = rule.maskChar ?? this.maskChar;

    // Guard clause: Preserve original format
    if (rule.preserveLength) {
      return value.replace(/\d/g, (match, offset) => {
        const digitIndex = value.substring(0, offset).replace(/\D/g, '').length;
        return digitIndex < clean.length - 4 ? maskChar : match;
      });
    }

    // Fixed format: ****-****-****-1111
    return `${maskChar.repeat(4)}-${maskChar.repeat(4)}-${maskChar.repeat(4)}-${clean.slice(-4)}`;
  }

  /**
   * Masks SSN.
   * Uses guard clause pattern for preserveLength option.
   * Single Responsibility: Only masks SSNs.
   *
   * @param value - SSN
   * @param rule - Masking rule
   * @returns Masked SSN
   * @private
   */
  private maskSSN(value: string, rule: MaskingRule): string {
    const clean = value.replace(/\D/g, '');

    // Guard clause: Preserve original format
    if (rule.preserveLength) {
      const maskChar = rule.maskChar ?? this.maskChar;
      return value.replace(/\d/g, (match, offset) => {
        const digitIndex = value.substring(0, offset).replace(/\D/g, '').length;
        return digitIndex < clean.length - 4 ? maskChar : match;
      });
    }

    // Fixed format: ***-**-6789
    return `***-**-${clean.slice(-4)}`;
  }

  /**
   * Masks email address.
   * Functional approach: Pure function with guard clauses.
   * Single Responsibility: Only masks emails.
   *
   * @param value - Email address
   * @param rule - Masking rule
   * @returns Masked email
   * @private
   */
  private maskEmail(value: string, rule: MaskingRule): string {
    const atIndex = value.indexOf('@');

    // Guard clause: Invalid email format (no @ or @ at start)
    if (atIndex <= 0) {
      return this.maskDefault(value, rule);
    }

    // Functional decomposition: Extract parts
    const username = value.substring(0, atIndex);
    const domain = value.substring(atIndex);
    const maskChar = rule.maskChar ?? this.maskChar;

    // Guard clause: Preserve original format
    if (rule.preserveLength) {
      // Functional approach: Build masked username using ternary operator
      const maskedUsername =
        username.length > 1
          ? username.charAt(0) + maskChar.repeat(username.length - 1)
          : maskChar.repeat(username.length);
      return maskedUsername + domain;
    }

    // Fixed format: first char + *** + domain
    return `${username.charAt(0)}***${domain}`;
  }

  /**
   * Masks phone number.
   * Functional approach: Pure function with guard clauses.
   * Single Responsibility: Only masks phone numbers.
   *
   * @param value - Phone number
   * @param rule - Masking rule
   * @returns Masked phone number
   * @private
   */
  private maskPhone(value: string, rule: MaskingRule): string {
    const clean = value.replace(/\D/g, '');
    const maskChar = rule.maskChar ?? this.maskChar;

    // Guard clause: Preserve original format
    if (rule.preserveLength) {
      // Functional approach: Use replace with callback
      return value.replace(/\d/g, (match, offset) => {
        const digitIndex = value.substring(0, offset).replace(/\D/g, '').length;
        return digitIndex < clean.length - 4 ? maskChar : match;
      });
    }

    // Fixed format: ***-***-4567 (functional composition)
    return `${maskChar.repeat(3)}-${maskChar.repeat(3)}-${clean.slice(-4)}`;
  }

  /**
   * Masks password.
   * Functional approach: Pure function - simplest strategy.
   * Single Responsibility: Only masks passwords.
   *
   * @param value - Password
   * @param rule - Masking rule
   * @returns Masked password
   * @private
   */
  private maskPassword(value: string, rule: MaskingRule): string {
    const maskChar = rule.maskChar ?? this.maskChar;
    // Pure function: Always mask entire password
    return maskChar.repeat(value.length);
  }

  /**
   * Masks token.
   * Functional approach: Pure function with guard clauses.
   * Single Responsibility: Only masks tokens.
   *
   * @param value - Token
   * @param rule - Masking rule
   * @returns Masked token
   * @private
   */
  private maskToken(value: string, rule: MaskingRule): string {
    const maskChar = rule.maskChar ?? this.maskChar;

    // Guard clause: Preserve original format
    if (rule.preserveLength) {
      // Functional composition: first 4 + mask + last 5
      return (
        value.substring(0, 4) +
        maskChar.repeat(value.length - 9) +
        value.substring(value.length - 5)
      );
    }

    // Guard clause: Short token - mask entirely
    if (value.length <= 8) {
      return maskChar.repeat(value.length);
    }

    // Long token: first 4 + ... + last 5 (functional composition)
    return `${value.substring(0, 4)}...${value.substring(value.length - 5)}`;
  }

  /**
   * Default masking strategy.
   * Functional approach: Pure function with guard clauses.
   * Single Responsibility: Only provides default masking.
   *
   * @param value - Value to mask
   * @param rule - Masking rule
   * @returns Masked value
   * @private
   */
  private maskDefault(value: string, rule: MaskingRule): string {
    const maskChar = rule.maskChar ?? this.maskChar;

    // Guard clause: Preserve original length
    if (rule.preserveLength) {
      return maskChar.repeat(value.length);
    }

    // Default: Mask up to 8 characters (functional: Math.min for upper bound)
    return maskChar.repeat(Math.min(value.length, 8));
  }

  /**
   * Gets masking engine statistics.
   * @returns Dictionary with masking statistics
   */
  public getStats(): Record<string, any> {
    return {
      initialized: this.initialized,
      totalRules: this.rules.length,
      defaultRules: this.rules.filter((r) =>
        [
          MaskingStrategy.CREDIT_CARD,
          MaskingStrategy.SSN,
          MaskingStrategy.EMAIL,
          MaskingStrategy.PHONE,
          MaskingStrategy.PASSWORD,
          MaskingStrategy.TOKEN,
        ].includes(r.strategy)
      ).length,
      customRules: this.rules.filter((r) => r.strategy === MaskingStrategy.CUSTOM).length,
      strategies: this.rules.map((r) => r.strategy),
    };
  }

  /**
   * Checks if the masking engine is initialized.
   * @returns True if initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown the masking engine.
   */
  public shutdown(): void {
    this.rules = [];
    this.initialized = false;
  }
}

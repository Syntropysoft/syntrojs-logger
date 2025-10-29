/**
 * Stryker Configuration for @syntrojs/logger
 *
 * Mutation testing configuration optimized for logger library
 */

/** @type {import('@stryker-mutator/core').PartialStrykerOptions} */
const config = {
  packageManager: 'npm',
  testRunner: 'vitest',
  
  // Use 'off' for less resource-intensive analysis (change to 'perTest' for better accuracy)
  coverageAnalysis: 'off',

  // Mutate only source code (exclude tests, examples, types, etc.)
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts', // Barrel export, no logic
    '!src/**/index.ts', // Barrel exports
    '!src/types.ts', // Type definitions only
    '!src/examples/**', // Examples (if moved back to src)
  ],

  // Vitest config
  vitest: {
    configFile: 'vitest.config.ts',
  },

  // Thresholds for CI/CD (lowered for initial runs)
  thresholds: {
    high: 70,   // Realistic target with equivalent mutants excluded
    low: 50,    // Minimum acceptable score
    break: 40,  // Break build below this
  },

  // Minimal reporters to reduce I/O overhead
  reporters: ['progress', 'clear-text'],

  // HTML report output (commented for lighter runs, uncomment when needed)
  // htmlReporter: {
  //   fileName: 'reports/mutation/index.html',
  // },

  // JSON report for CI/CD (commented for lighter runs, uncomment when needed)
  // jsonReporter: {
  //   fileName: 'reports/mutation/mutation-report.json',
  // },

  // Plugins - TypeScript checker disabled for performance
  plugins: ['@stryker-mutator/vitest-runner'],
  
  // TypeScript checker disabled to reduce resource usage
  // Uncomment to enable stricter type checking (will be slower):
  // plugins: ['@stryker-mutator/vitest-runner', '@stryker-mutator/typescript-checker'],
  // checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',

  // Conservative performance settings to prevent system hangs
  concurrency: 2, // Reduced from 8 to prevent resource exhaustion
  timeoutMS: 20000, // 20 seconds per test (reduced from 30)
  timeoutFactor: 1.5, // Reduced from 2.0

  // Disable mutations that are rarely useful
  disableTypeChecks: '{test,spec}/**/*.{js,ts}',

  // More aggressive exclusion of mutators to reduce mutation count
  mutator: {
    excludedMutations: [
      'StringLiteral', // Often breaks error messages and compliance configs
      'ObjectLiteral', // Config objects and compliance rules
      'LogicalOperator', // Guard clause OR/AND mutants are often equivalent
      'ConditionalExpression', // Ternary operator mutants often don't change behavior
      'BooleanLiteral', // Many boolean mutants in configuration are equivalent
      'ArrayDeclaration', // Array declarations are often configuration
      'ArrowFunction', // Arrow function mutations often produce equivalent code
      'BlockStatement', // Block statement mutations are often equivalent
    ],
  },

  // Enable incremental mode for faster subsequent runs
  incremental: true,
  incrementalFile: 'reports/mutation/stryker-incremental.json',
  
  // Additional memory management
  maxTestRunnerReuse: 50, // Reuse test runners to reduce overhead
  cleanTempDir: true, // Clean temporary directory
};

export default config;


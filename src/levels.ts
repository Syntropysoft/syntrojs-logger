/**
 * Log levels and their weights
 */

export const LOG_LEVEL_WEIGHTS = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
  silent: 0,
} as const;

export type LogLevel = keyof typeof LOG_LEVEL_WEIGHTS;

export const logLevels = Object.keys(LOG_LEVEL_WEIGHTS) as LogLevel[];

/**
 * Checks if a level should be logged based on the configured level
 */
export function isLevelEnabled(logLevel: LogLevel, configuredLevel: LogLevel): boolean {
  if (configuredLevel === 'silent') return false;
  if (logLevel === 'silent') return false;

  return LOG_LEVEL_WEIGHTS[logLevel] >= LOG_LEVEL_WEIGHTS[configuredLevel];
}

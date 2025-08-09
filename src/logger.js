// logger.js
// Central logging helper for Rocket Wars
// Thin wrapper over console to prepare for future filtering / formatting.

import { loadDebugSetting } from './debugSettings.js';

// Numeric log levels (lower = more severe)
export const LOG_LEVEL_ERROR = 1;
export const LOG_LEVEL_WARNING = 2;
export const LOG_LEVEL_INFO = 3;
export const LOG_LEVEL_TRACE = 4;

/**
 * Resolve a stored log level (string/number) to numeric level via mapping.
 * Kept local to logger now.
 * @param {any} raw
 * @param {Record<string,number>} map
 * @param {number} fallback
 * @returns {number}
 */
function resolveNumericLevel(raw, map, fallback) {
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
        const lower = raw.toLowerCase();
        if (map[lower] !== undefined) return map[lower];
        const parsed = parseInt(lower, 10);
        if (!isNaN(parsed)) return parsed;
    }
    return fallback;
}

// Current minimum level to output (can be changed at runtime)
let currentLevel = LOG_LEVEL_TRACE; // default: show everything

/**
 * Set global minimum log output level.
 * @param {number} level One of LOG_LEVEL_*
 */
export function setLogLevel(level) {
    currentLevel = level;
    info(`Log level set to: ${level}`);
}

/**
 * Get current minimum log output level.
 * @returns {number}
 */
export function getLogLevel() {
    return currentLevel;
}

/**
 * Core log function using numeric levels.
 * @param {number} level One of LOG_LEVEL_*
 * @param {...any} args Values to log
 */
export function log(level, ...args) {
    if (level > currentLevel) return; // filtered out
    switch (level) {
        case LOG_LEVEL_TRACE:
            console.log(...args);
            break;
        case LOG_LEVEL_INFO:
            console.log(...args);
            break;
        case LOG_LEVEL_WARNING:
            console.warn(...args);
            break;
        case LOG_LEVEL_ERROR:
            console.error(...args);
            break;
        default:
            console.log(...args);
    }
}

// Convenience helpers
export const trace = (...a) => log(LOG_LEVEL_TRACE, ...a);
export const info = (...a) => log(LOG_LEVEL_INFO, ...a);
export const warn = (...a) => log(LOG_LEVEL_WARNING, ...a);
export const error = (...a) => log(LOG_LEVEL_ERROR, ...a);

// Initialize log level synchronously via debugSettings
const __rawLogLevel = loadDebugSetting('logLevel', 'warning');
const __levelMapping = {
    error: LOG_LEVEL_ERROR,
    warning: LOG_LEVEL_WARNING,
    warn: LOG_LEVEL_WARNING,
    info: LOG_LEVEL_INFO,
    trace: LOG_LEVEL_TRACE,
    debug: LOG_LEVEL_TRACE
};
const __resolvedLevel = resolveNumericLevel(__rawLogLevel, __levelMapping, LOG_LEVEL_INFO);
if (__resolvedLevel >= LOG_LEVEL_ERROR && __resolvedLevel <= LOG_LEVEL_TRACE) {
    setLogLevel(__resolvedLevel);
}

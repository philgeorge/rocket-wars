// logger.js
// Central logging helper for Rocket Wars
// Thin wrapper over console to prepare for future filtering / formatting.

/**
 * Log a message.
 * @param {'trace'|'info'|'warning'|'error'} level
 * @param {...any} args
 */
export function log(level, ...args) {
    switch (level) {
        case 'trace':
        case 'info':
            console.log(...args);
            break;
        case 'warning':
            console.warn(...args);
            break;
        case 'error':
            console.error(...args);
            break;
        default:
            console.log(...args);
            break;
    }
}

export const trace = (...a) => log('trace', ...a);
export const info = (...a) => log('info', ...a);
export const warn = (...a) => log('warning', ...a);
export const error = (...a) => log('error', ...a);

// debugSettings.js
// Lightweight helpers for reading debug-related settings from localStorage.
// Intentionally has no dependencies to avoid circular imports.

/**
 * Load a single debug setting from localStorage.
 * Interprets 'true'/'false' as booleans; returns raw string otherwise.
 * @param {string} key
 * @param {any} defaultValue
 * @returns {any}
 */
export function loadDebugSetting(key, defaultValue) {
    try {
        if (typeof localStorage === 'undefined') return defaultValue;
        const value = localStorage.getItem(`debug.${key}`);
        if (value === null || value === undefined) return defaultValue;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    } catch {
        return defaultValue;
    }
}

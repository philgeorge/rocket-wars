// storage.js
// Browser localStorage utilities for Rocket Wars

/**
 * Default game configuration including player names
 */
export const defaultGameConfig = {
    numPlayers: 2,
    rounds: 5,
    turnTime: 30,
    windVariation: 30,
    gravity: 60,
    playerNames: {
        player1: '',
        player2: '',
        player3: '',
        player4: ''
    }
};

/**
 * Load game configuration from localStorage
 * @returns {Object} Saved config or default config
 */
import { info, warn, trace } from './logger.js';

export function loadGameConfig() {
    try {
        if (typeof localStorage === 'undefined') {
            warn('localStorage not available - returning defaults');
            return { ...defaultGameConfig };
        }
        const savedConfig = localStorage.getItem('gameConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            info('Loaded saved game config:', config);
            // Merge with defaults to ensure all properties exist
            return {
                ...defaultGameConfig,
                ...config,
                // Ensure playerNames object exists and has all player slots
                playerNames: {
                    ...defaultGameConfig.playerNames,
                    ...(config.playerNames || {})
                }
            };
        }
    } catch (error) {
        warn('Failed to load saved game config:', error);
    }
    info('Using default game config');
    return { ...defaultGameConfig };
}

/**
 * Save game configuration to localStorage
 * @param {Object} config - Game configuration to save
 */
export function saveGameConfig(config) {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem('gameConfig', JSON.stringify(config));
        trace('Saved game config to localStorage:', config);
    } catch (error) {
        warn('Failed to save game config:', error);
    }
}

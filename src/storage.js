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
export function loadGameConfig() {
    try {
        if (typeof localStorage === 'undefined') {
            console.warn('localStorage not available - returning defaults');
            return { ...defaultGameConfig };
        }
        const savedConfig = localStorage.getItem('gameConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            console.log('Loaded saved game config:', config);
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
        console.warn('Failed to load saved game config:', error);
    }
    console.log('Using default game config');
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
        console.log('Saved game config to localStorage:', config);
    } catch (error) {
        console.warn('Failed to save game config:', error);
    }
}

/**
 * Load debug settings from localStorage
 * @param {Object} debugSettings - Debug settings object to update
 */
export function loadDebugSettings(debugSettings) {
    try {
        // Enumerate all properties in the debugSettings object
        if (typeof localStorage !== 'undefined') {
            for (const propertyName in debugSettings) {
                if (Object.prototype.hasOwnProperty.call(debugSettings, propertyName)) {
                    const storageKey = `debug.${propertyName}`;
                    const setting = localStorage.getItem(storageKey);
                    if (setting === 'true') {
                        debugSettings[propertyName] = true;
                        console.log(`🐛 Debug: ${propertyName} ENABLED via localStorage`);
                    } else if (setting === 'false') {
                        debugSettings[propertyName] = false;
                        console.log(`🐛 Debug: ${propertyName} DISABLED via localStorage`);
                    }
                }
            }
        } else {
            console.warn('localStorage not available for debug settings');
        }
    } catch (error) {
        console.warn('Failed to load debug settings from localStorage:', error);
    }
}

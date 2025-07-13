// storage.js
// Browser localStorage utilities for Rocket Wars

/**
 * Default game configuration including player names
 */
export const defaultGameConfig = {
    numPlayers: 2,
    rounds: 10,
    turnTime: 30,
    windVariation: 40,
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
        localStorage.setItem('gameConfig', JSON.stringify(config));
        console.log('Saved game config to localStorage:', config);
    } catch (error) {
        console.warn('Failed to save game config:', error);
    }
}



/**
 * Check if aiming instructions have been shown to the user
 * @returns {boolean} True if instructions have been shown before
 */
export function hasShownAimingInstructions() {
    try {
        const shown = localStorage.getItem('aimingInstructionsShown');
        return shown === 'true';
    } catch (error) {
        console.warn('Failed to check aiming instructions status:', error);
        return false;
    }
}

/**
 * Mark that aiming instructions have been shown to the user
 */
export function markAimingInstructionsShown() {
    try {
        localStorage.setItem('aimingInstructionsShown', 'true');
        console.log('Marked aiming instructions as shown');
    } catch (error) {
        console.warn('Failed to save aiming instructions status:', error);
    }
}

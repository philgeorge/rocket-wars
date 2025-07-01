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
 * Load player names from localStorage
 * @returns {Object} Object with player names (player1, player2, etc.)
 */
export function loadPlayerNames() {
    const config = loadGameConfig();
    return config.playerNames || defaultGameConfig.playerNames;
}

/**
 * Save player names to localStorage (merges with existing config)
 * @param {Object} playerNames - Object with player names to save
 */
export function savePlayerNames(playerNames) {
    const config = loadGameConfig();
    config.playerNames = {
        ...config.playerNames,
        ...playerNames
    };
    saveGameConfig(config);
}

/**
 * Save a single player name to localStorage
 * @param {string} playerKey - Player key (player1, player2, etc.)
 * @param {string} name - Player name to save
 */
export function savePlayerName(playerKey, name) {
    const playerNames = loadPlayerNames();
    playerNames[playerKey] = name;
    savePlayerNames(playerNames);
}

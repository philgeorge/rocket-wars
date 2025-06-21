// playerSetup.js
// Player setup stage logic for Rocket Wars

import { createDOMPlayerSetupOverlay } from './playerSetupDOM.js';

/**
 * Setup stage state management
 * @typedef {Object} SetupState
 * @property {number} currentPlayerIndex - Current player being processed (0-based)
 * @property {Array} players - Array of player data objects
 * @property {Array<number>} availableBases - Array of unused flat base indices
 * @property {boolean} isComplete - Whether all players have completed setup
 */

/**
 * Player data structure
 * @typedef {Object} PlayerData
 * @property {string} id - Player identifier (player1, player2, etc.)
 * @property {string} name - User-entered name (max 10 chars)
 * @property {string} team - Team identifier for colors
 * @property {number|null} baseIndex - Index of chosen flat base
 * @property {number} health - Starting health
 * @property {Object|null} turret - Will hold turret object reference
 */

/**
 * Initialize the player setup stage using DOM overlay
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {Object} gameConfig - Game configuration from form
 * @param {Array} flatBases - Array of available flat base locations
 * @returns {Promise<Array<PlayerData>>} Promise that resolves with player data when setup is complete
 */
export function initializePlayerSetup(scene, gameConfig, flatBases) {
    console.log('🎮 Starting DOM-based player setup stage...');
    
    // Disable camera controls to free up WASD keys for name input
    const sceneAny = /** @type {any} */ (scene);
    if (sceneAny.cameraControls && sceneAny.cameraControls.disable) {
        sceneAny.cameraControls.disable();
    }
    
    return new Promise((resolve) => {
        // Initialize player data structures
        const players = [];
        for (let i = 1; i <= gameConfig.numPlayers; i++) {
            /** @type {PlayerData} */
            const playerData = {
                id: `player${i}`,
                name: `Player ${i}`, // Default name, will be updated by user input
                team: `player${i}`,
                baseIndex: null,
                health: 100,
                turret: null
            };
            players.push(playerData);
        }
        
        // Create DOM-based setup overlay
        createDOMPlayerSetupOverlay(players, flatBases, scene, (completedPlayers) => {
            console.log('🎯 Player setup complete! All players configured:', completedPlayers.map(p => ({
                id: p.id,
                name: p.name,
                baseIndex: p.baseIndex
            })));
            
            // Camera controls should already be enabled from the last base selection
            // No need to explicitly enable them here
            console.log('🎮 Camera controls should already be enabled for combat');
            
            // Resolve the promise with player data
            resolve(completedPlayers);
        });
    });
}

// All other functions removed - now using DOM-based approach

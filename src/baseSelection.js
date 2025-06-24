// baseSelection.js
// Base selection stage logic for Rocket Wars

import { createDOMBaseSelectionOverlay } from './baseSelectionDOM.js';

/**
 * Base selection stage state management
 * @typedef {Object} SetupState
 * @property {number} currentPlayerIndex - Current player being processed (0-based)
 * @property {Array} players - Array of player data objects
 * @property {Array<number>} availableBases - Array of unused flat base indices
 * @property {boolean} isComplete - Whether all players have completed base selection
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
 * Initialize the base selection stage using DOM overlay
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {Object} gameConfig - Game configuration from form
 * @param {Array} flatBases - Array of available flat base locations
 * @returns {Promise<{players: Array<PlayerData>, turrets: Array}>} Promise that resolves with player data and turrets when base selection is complete
 */
export function initializeBaseSelection(scene, gameConfig, flatBases) {
    console.log('🎮 Starting DOM-based base selection stage...');
    
    // Camera controls can remain enabled since we're only doing base selection now
    console.log('🎮 Camera controls remain enabled for base selection');
    
    return new Promise((resolve) => {
        // Initialize player data structures
        const players = [];
        for (let i = 1; i <= gameConfig.numPlayers; i++) {
            const playerKey = `player${i}`;
            /** @type {PlayerData} */
            const playerData = {
                id: playerKey,
                name: gameConfig.playerNames?.[playerKey] || `Player ${i}`, // Use name from game config
                team: playerKey,
                baseIndex: null,
                health: 100,
                turret: null
            };
            players.push(playerData);
        }
        
        console.log('🎮 Player data initialized with names from game config:', players.map(p => ({ id: p.id, name: p.name })));
        
        // Create DOM-based base selection overlay
        createDOMBaseSelectionOverlay(players, flatBases, scene, (completedPlayers, existingTurrets = []) => {
            console.log('🎯 Base selection complete! All players configured:', completedPlayers.map(p => ({
                id: p.id,
                name: p.name,
                baseIndex: p.baseIndex
            })));
            
            console.log('🏭 Turrets already created during base selection:', existingTurrets.length);
            
            // Camera controls should already be enabled from the last base selection
            // No need to explicitly enable them here
            console.log('🎮 Camera controls should already be enabled for combat');
            
            // Resolve the promise with player data and existing turrets
            resolve({ players: completedPlayers, turrets: existingTurrets });
        });
    });
}

// All other functions removed - now using DOM-based approach

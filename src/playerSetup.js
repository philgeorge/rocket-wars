// playerSetup.js
// Player setup stage logic for Rocket Wars

import { createPlayerSetupPanel } from './playerSetupUI.js';

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
 * Initialize the player setup stage
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {Object} gameConfig - Game configuration from form
 * @param {Array} flatBases - Array of available flat base locations
 * @returns {Promise<Array<PlayerData>>} Promise that resolves with player data when setup is complete
 */
export function initializePlayerSetup(scene, gameConfig, flatBases) {
    console.log('🎮 Starting player setup stage...');
    
    return new Promise((resolve) => {
        // Initialize setup state
        /** @type {SetupState} */
        const setupState = {
            currentPlayerIndex: 0,
            players: [],
            availableBases: flatBases.map((_, index) => index), // All bases initially available
            isComplete: false
        };
        
        // Initialize player data structures
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
            setupState.players.push(playerData);
        }
        
        // Create and show the player setup UI
        const setupPanel = createPlayerSetupPanel(scene, setupState, gameConfig);
        
        // Store setup state and panel on scene for access
        scene.playerSetupState = setupState;
        scene.playerSetupPanel = setupPanel;
        
        // Start with the first player
        startPlayerSetup(scene, setupState, setupPanel, resolve);
    });
}

/**
 * Start setup for the current player
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {SetupState} setupState - Current setup state
 * @param {Object} setupPanel - The setup UI panel
 * @param {Function} resolve - Promise resolve function to call when complete
 */
function startPlayerSetup(scene, setupState, setupPanel, resolve) {
    const currentPlayer = setupState.players[setupState.currentPlayerIndex];
    
    console.log(`📝 Setting up ${currentPlayer.id} (${setupState.currentPlayerIndex + 1}/${setupState.players.length})`);
    
    // Update the UI panel for current player
    setupPanel.showForPlayer(currentPlayer, setupState.currentPlayerIndex + 1, setupState.players.length);
    
    // Set up completion callback for when this player finishes
    setupPanel.onPlayerComplete = (playerData) => {
        handlePlayerComplete(scene, setupState, setupPanel, playerData, resolve);
    };
}

/**
 * Handle completion of current player setup
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {SetupState} setupState - Current setup state
 * @param {Object} setupPanel - The setup UI panel
 * @param {PlayerData} playerData - Completed player data
 * @param {Function} resolve - Promise resolve function
 */
function handlePlayerComplete(scene, setupState, setupPanel, playerData, resolve) {
    // Update the player data in our state
    setupState.players[setupState.currentPlayerIndex] = playerData;
    
    console.log(`✅ ${playerData.id} setup complete: name="${playerData.name}", base=${playerData.baseIndex}`);
    
    // Remove the selected base from available bases
    if (playerData.baseIndex !== null) {
        const baseIndex = setupState.availableBases.indexOf(playerData.baseIndex);
        if (baseIndex > -1) {
            setupState.availableBases.splice(baseIndex, 1);
        }
    }
    
    // Move to next player or complete setup
    setupState.currentPlayerIndex++;
    
    if (setupState.currentPlayerIndex >= setupState.players.length) {
        // All players complete
        completePlayerSetup(scene, setupState, setupPanel, resolve);
    } else {
        // Set up next player
        startPlayerSetup(scene, setupState, setupPanel, resolve);
    }
}

/**
 * Complete the player setup stage
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {SetupState} setupState - Current setup state
 * @param {Object} setupPanel - The setup UI panel
 * @param {Function} resolve - Promise resolve function
 */
function completePlayerSetup(scene, setupState, setupPanel, resolve) {
    console.log('🎯 Player setup complete! All players configured:', setupState.players.map(p => ({
        id: p.id,
        name: p.name,
        baseIndex: p.baseIndex
    })));
    
    // Hide the setup panel
    setupPanel.hide();
    
    // Clean up scene references
    scene.playerSetupState = null;
    scene.playerSetupPanel = null;
    
    // Mark setup as complete
    setupState.isComplete = true;
    
    // Resolve the promise with player data
    resolve(setupState.players);
}

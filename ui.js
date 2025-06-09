// ui.js
// Game UI components for Rocket Wars

import { getTeamColorCSS } from './constants.js';

/**
 * Create a floating status panel showing game settings and player stats
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} gameState - Game state object containing wind, gravity, and player data
 * @returns {Phaser.GameObjects.Container & {updateDisplay: Function, windText: any, gravityText: any, playerElements: any[]}}
 */
export function createStatusPanel(scene, gameState) {
    // Create main container positioned at top-right of screen
    /** @type {Phaser.GameObjects.Container & {updateDisplay: Function, windText: any, gravityText: any, playerElements: any[]}} */
    const statusPanel = /** @type {any} */ (scene.add.container(0, 0));
    
    // Calculate panel height based on number of players
    const numPlayers = gameState.numPlayers || 2;
    const baseHeight = 80; // Height for title and environment section
    const playerHeight = 35; // Height per player section
    const totalHeight = baseHeight + (numPlayers * playerHeight);
    
    // Create background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.lineStyle(2, 0xffffff, 0.6);
    bg.fillRoundedRect(0, 0, 200, totalHeight, 8);
    bg.strokeRoundedRect(0, 0, 200, totalHeight, 8);
    
    // Title
    const title = scene.add.text(100, 15, 'GAME STATUS', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center'
    }).setOrigin(0.5, 0.5);
    
    // Environment section
    const envTitle = scene.add.text(10, 35, 'ENVIRONMENT', {
        fontSize: '15px',
        color: '#00ff00',
        fontStyle: 'bold'
    });
    
    const windText = scene.add.text(10, 50, '', {
        fontSize: '14px',
        color: '#ffffff'
    });
    
    const gravityText = scene.add.text(10, 65, '', {
        fontSize: '14px',
        color: '#ffffff'
    });
    
    // Player colors for 2-4 players - now using shared constants
    // (Removed - using getTeamColorCSS function instead)
    
    // Create player sections dynamically
    const playerElements = [];
    const elements = [bg, title, envTitle, windText, gravityText];
    
    for (let i = 1; i <= numPlayers; i++) {
        const yOffset = 80 + ((i - 1) * playerHeight);
        const playerKey = `player${i}`;
        const playerColor = getTeamColorCSS(playerKey);
        
        const playerTitle = scene.add.text(10, yOffset, `PLAYER ${i}`, {
            fontSize: '15px',
            color: playerColor,
            fontStyle: 'bold'
        });
        
        const playerHealth = scene.add.text(10, yOffset + 15, '', {
            fontSize: '14px',
            color: '#ffffff'
        });
        
        const playerStats = scene.add.text(10, yOffset + 30, '', {
            fontSize: '14px',
            color: '#ffffff'
        });
        
        playerElements.push({
            playerKey,
            title: playerTitle,
            health: playerHealth,
            stats: playerStats
        });
        
        elements.push(playerTitle, playerHealth, playerStats);
    }
    
    // Add all elements to container
    statusPanel.add(elements);
    
    // Store text references for updates
    statusPanel.windText = windText;
    statusPanel.gravityText = gravityText;
    statusPanel.playerElements = playerElements;
    
    // Method to update the display with current game state
    statusPanel.updateDisplay = function(gameState) {
        /** @type {typeof statusPanel} */
        const self = this;
        // Update wind display with direction indicator
        const windDirection = gameState.wind.current >= 0 ? '→' : '←';
        const windSpeed = Math.abs(gameState.wind.current);
        self.windText.setText(`Wind: ${windDirection} ${windSpeed} (±${gameState.wind.variation}%)`);
        
        // Update gravity display
        self.gravityText.setText(`Gravity: ${gameState.gravity}`);
        
        // Update all player stats
        self.playerElements.forEach(playerElement => {
            const player = gameState[playerElement.playerKey];
            if (player) {
                playerElement.health.setText(`Health: ${player.health}%`);
                playerElement.stats.setText(`Kills: ${player.kills} Deaths: ${player.deaths}`);
            }
        });
    };
    
    // Position panel at top-right of screen (will be updated in scene)
    statusPanel.setScrollFactor(0); // Keep panel fixed on screen regardless of camera movement
    
    return statusPanel;
}

/**
 * Initialize default game state object
 * @param {Object} [config] - Optional game configuration from form
 * @returns {Object} Default game state with wind, gravity, and player data
 */
export function createGameState(config = {}) {
    const windVariation = config.windVariation || 50; // Wind variation from form or default
    const gravity = config.gravity || 75; // Gravity from form or default
    const numPlayers = config.numPlayers || 2; // Number of players from form or default
    const maxWind = (windVariation / 100) * 100; // Calculate max wind for initial value
    const initialWind = Math.floor(Math.random() * (2 * maxWind + 1)) - maxWind; // Random initial wind
    
    // Create player objects dynamically based on number of players
    const gameState = {
        wind: {
            current: initialWind, // Current wind (-100 to +100, negative = left, positive = right)
            variation: windVariation // Wind variation percentage (0-100%), controls how much wind can change
        },
        gravity: gravity, // Gravity setting from form
        numPlayers: numPlayers
    };
    
    // Add player objects dynamically
    for (let i = 1; i <= numPlayers; i++) {
        gameState[`player${i}`] = {
            health: 100,
            kills: 0,
            deaths: 0
        };
    }
    
    return gameState;
}

/**
 * Update wind value for new turn (varies within variation range)
 * @param {Object} gameState - Game state object
 */
export function updateWindForNewTurn(gameState) {
    // Calculate max wind based on variation percentage
    const maxWind = (gameState.wind.variation / 100) * 100; // Scale 0-100% to 0-100 wind units
    
    // Generate random wind from -maxWind to +maxWind
    gameState.wind.current = Math.floor(Math.random() * (2 * maxWind + 1)) - maxWind;
}

/**
 * Apply damage to a player's health
 * @param {Object} gameState - Game state object
 * @param {string} playerKey - 'player1' or 'player2'
 * @param {number} damage - Damage amount (0-100)
 */
export function applyDamage(gameState, playerKey, damage) {
    gameState[playerKey].health = Math.max(0, gameState[playerKey].health - damage);
    
    // Check if player died
    if (gameState[playerKey].health <= 0) {
        gameState[playerKey].deaths++;
        
        // Award kill to other player
        const otherPlayer = playerKey === 'player1' ? 'player2' : 'player1';
        gameState[otherPlayer].kills++;
    }
}

/**
 * Position status panel relative to camera view
 * @param {Phaser.GameObjects.Container} statusPanel - The status panel container
 * @param {Phaser.Cameras.Scene2D.Camera} camera - The main camera
 */
export function positionStatusPanel(statusPanel, camera) {
    // Position at top-right of camera view with some padding
    statusPanel.x = camera.scrollX + camera.width - 220; // 220 = panel width + padding
    statusPanel.y = camera.scrollY + 20; // 20px from top
}

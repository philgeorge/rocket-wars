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
    const baseHeight = 60; // Height for environment section only (reduced from 80)
    const playerHeight = 60; // Height per player section (increased to fit 3 lines of text)
    const bottomPadding = 12;
    const totalHeight = baseHeight + (numPlayers * playerHeight) + bottomPadding;
    
    // Create background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.lineStyle(2, 0xffffff, 0.6);
    bg.fillRoundedRect(0, 0, 210, totalHeight, 8);
    bg.strokeRoundedRect(0, 0, 210, totalHeight, 8);
    
    // Environment section
    const envTitle = scene.add.text(10, 10, 'ENVIRONMENT', {
        fontSize: '1rem',
        color: '#00ff00',
        fontStyle: 'bold'
    });
    
    const windText = scene.add.text(10, 28, '', {
        fontSize: '1rem',
        color: '#ffffff'
    });
    
    const gravityText = scene.add.text(10, 46, '', {
        fontSize: '1rem',
        color: '#ffffff'
    });
    
    // Player colors for 2-4 players - now using shared constants
    // (Removed - using getTeamColorCSS function instead)
    
    // Create player sections dynamically
    const playerElements = [];
    const elements = [bg, envTitle, windText, gravityText];
    
    for (let i = 1; i <= numPlayers; i++) {
        const yOffset = baseHeight + 10 + ((i - 1) * playerHeight);
        const playerKey = `player${i}`;
        const playerColor = getTeamColorCSS(playerKey);
        
        const playerTitle = scene.add.text(10, yOffset, `PLAYER ${i}`, {
            fontSize: '1rem',
            color: playerColor,
            fontStyle: 'bold'
        });
        
        const playerHealth = scene.add.text(10, yOffset + 18, '', {
            fontSize: '1rem',
            color: '#ffffff'
        });
        
        const playerStats = scene.add.text(10, yOffset + 36, '', {
            fontSize: '1rem',
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
    const windVariation = config.windVariation ?? 50; // Wind variation from form or default
    const gravity = config.gravity ?? 60; // Gravity from form or default (updated default)
    const numPlayers = config.numPlayers ?? 2; // Number of players from form or default
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
 * Update wind value for new turn (changes by at most +/-10 units)
 * @param {Object} gameState - Game state object
 */
export function updateWindForNewTurn(gameState) {
    // Wind can only change by up to +/-10 units per turn
    const maxDelta = 10;
    const maxWind = (gameState.wind.variation / 100) * 100; // Still use variation for clamping
    // Generate random delta from -10 to +10
    const delta = Math.floor(Math.random() * (2 * maxDelta + 1)) - maxDelta;
    let newWind = gameState.wind.current + delta;
    // Clamp to allowed wind range
    newWind = Math.max(-maxWind, Math.min(maxWind, newWind));
    gameState.wind.current = newWind;
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
 * Position status panel relative to viewport
 * @param {Phaser.GameObjects.Container} statusPanel - The status panel container
 * @param {number} viewportWidth - The viewport width
 */
export function positionStatusPanel(statusPanel, viewportWidth) {
    // Position at top-right of viewport with some padding
    statusPanel.x = viewportWidth - 230; // 210px panel width + 20px padding
    statusPanel.y = 20; // 20px from top
}

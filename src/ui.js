// ui.js
// Game UI components for Rocket Wars

import { getTeamColorCSS } from './constants.js';

/**
 * Create a floating environment panel showing wind and gravity
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} gameState - Game state object containing wind and gravity data
 * @returns {Phaser.GameObjects.Container & {updateDisplay: Function, windText: any, gravityText: any}}
 */
export function createEnvironmentPanel(scene, gameState) {
    // Create main container positioned at top-left of screen
    /** @type {Phaser.GameObjects.Container & {updateDisplay: Function, windText: any, gravityText: any}} */
    const envPanel = /** @type {any} */ (scene.add.container(0, 0));
    
    const panelHeight = 80;
    const panelWidth = 150;
    
    // Create background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.lineStyle(2, 0xffffff, 0.6);
    bg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    bg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    
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
    
    // Add all elements to container
    envPanel.add([bg, envTitle, windText, gravityText]);
    
    // Store text references for updates
    envPanel.windText = windText;
    envPanel.gravityText = gravityText;
    
    // Method to update the display with current game state
    envPanel.updateDisplay = function(gameState) {
        const self = /** @type {typeof envPanel} */ (this);
        // Update wind display with direction indicator
        const windDirection = gameState.wind.current >= 0 ? '→' : '←';
        const windSpeed = Math.abs(gameState.wind.current);
        self.windText.setText(`Wind: ${windDirection} ${windSpeed}`);
        
        // Update gravity display
        self.gravityText.setText(`Gravity: ${gameState.gravity}`);
    };
    
    // Position panel at top-left of screen (will be updated in scene)
    envPanel.setScrollFactor(0); // Keep panel fixed on screen regardless of camera movement
    
    return envPanel;
}

/**
 * Create a floating player stats panel showing all player information
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} gameState - Game state object containing player data
 * @returns {Phaser.GameObjects.Container & {updateDisplay: Function, playerElements: any[]}}
 */
export function createPlayerStatsPanel(scene, gameState, playerData = null) {
    // Create main container positioned at top-right of screen
    /** @type {Phaser.GameObjects.Container & {updateDisplay: Function, playerElements: any[]}} */
    const playerPanel = /** @type {any} */ (scene.add.container(0, 0));
    
    // Calculate panel height based on number of players
    const numPlayers = gameState.numPlayers || 2;
    const playerHeight = 40; // Height per player section (reduced from 60)
    const bottomPadding = 12;
    const totalHeight = (numPlayers * playerHeight) + bottomPadding;
    const panelWidth = 160;
    
    // Create background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.lineStyle(2, 0xffffff, 0.6);
    bg.fillRoundedRect(0, 0, panelWidth, totalHeight, 8);
    bg.strokeRoundedRect(0, 0, panelWidth, totalHeight, 8);
    
    // Create player sections dynamically
    const playerElements = [];
    const elements = [bg];
    
    for (let i = 1; i <= numPlayers; i++) {
        const yOffset = 10 + ((i - 1) * playerHeight);
        const playerKey = `player${i}`;
        const playerColor = getTeamColorCSS(playerKey);
        
        // Use player name from playerData if available, otherwise default
        let playerName = `PLAYER ${i}`;
        if (playerData && playerData[i - 1] && playerData[i - 1].name) {
            playerName = playerData[i - 1].name.toUpperCase();
        }
        
        const playerTitle = scene.add.text(10, yOffset, playerName, {
            fontSize: '1rem',
            color: playerColor,
            fontStyle: 'bold'
        });
         const playerHealth = scene.add.text(10, yOffset + 18, '', {
            fontSize: '1rem',
            color: '#ffffff'
        });

        playerElements.push({
            playerKey,
            title: playerTitle,
            health: playerHealth
        });

        elements.push(/** @type {any} */ (playerTitle), /** @type {any} */ (playerHealth));
    }
    
    // Add all elements to container
    playerPanel.add(elements);
    
    // Store references for updates
    playerPanel.playerElements = playerElements;
    
    // Method to update the display with current game state
    playerPanel.updateDisplay = function(gameState) {
        const self = /** @type {typeof playerPanel} */ (this);
        // Update all player stats
        self.playerElements.forEach(playerElement => {
            const player = gameState[playerElement.playerKey];
            if (player) {
                playerElement.health.setText(`Health: ${player.health}%`);
            }
        });
    };
    
    // Position panel at top-right of screen (will be updated in scene)
    playerPanel.setScrollFactor(0); // Keep panel fixed on screen regardless of camera movement
    
    // Store panel width for positioning calculations
    /** @type {any} */ (playerPanel).panelWidth = panelWidth;
    
    return playerPanel;
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
 * Position environment panel relative to viewport (left side)
 * @param {Phaser.GameObjects.Container} envPanel - The environment panel container
 */
export function positionEnvironmentPanel(envPanel) {
    // Position at top-left of viewport with some padding
    envPanel.x = 20; // 20px from left
    envPanel.y = 20; // 20px from top
}

/**
 * Position player stats panel relative to viewport (right side)
 * @param {Phaser.GameObjects.Container} playerPanel - The player stats panel container
 * @param {number} viewportWidth - The viewport width
 */
export function positionPlayerStatsPanel(playerPanel, viewportWidth) {
    // Get panel width from the panel object, with fallback
    const panelWidth = /** @type {any} */ (playerPanel).panelWidth || 200;
    // Position at top-right of viewport with some padding
    playerPanel.x = viewportWidth - (panelWidth + 20); // 20px padding
    playerPanel.y = 20; // 20px from top
}
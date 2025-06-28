// ui.js
// Game UI components for Rocket Wars

import { getTeamColorCSS } from './constants.js';

/**
 * Create a floating environment panel showing wind and gravity
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} gameState - Game state object containing wind and gravity data
 * @returns {Phaser.GameObjects.Container & {updateDisplay: Function, envTitle: any, windText: any, gravityText: any, timerText: any}}
 */
export function createEnvironmentPanel(scene, gameState) {
    // Create main container positioned at top-left of screen
    /** @type {Phaser.GameObjects.Container & {updateDisplay: Function, envTitle: any, windText: any, gravityText: any, timerText: any}} */
    const envPanel = /** @type {any} */ (scene.add.container(0, 0));
    
    const panelHeight = 92; // Reduced height by 8px
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
    
    const timerText = scene.add.text(10, 66, '', {
        fontSize: '1rem',
        color: '#ffff00' // Yellow for visibility
    });
    
    // Add all elements to container
    envPanel.add([bg, envTitle, windText, gravityText, timerText]);
    
    // Store text references for updates
    envPanel.envTitle = envTitle;
    envPanel.windText = windText;
    envPanel.gravityText = gravityText;
    envPanel.timerText = timerText;
    
    // Method to update the display with current game state
    envPanel.updateDisplay = function(gameState) {
        const self = /** @type {typeof envPanel} */ (this);
        
        // Update title to show current round and max rounds
        self.envTitle.setText(`ROUND ${gameState.currentRound}/${gameState.maxRounds}`);
        
        // Update wind display with direction indicator
        const windDirection = gameState.wind.current >= 0 ? '→' : '←';
        const windSpeed = Math.abs(gameState.wind.current);
        self.windText.setText(`Wind: ${windDirection} ${windSpeed}`);
        
        // Update gravity display
        self.gravityText.setText(`Gravity: ${gameState.gravity}`);
        
        // Update timer display
        if (gameState.turnTimeLimit > 0) {
            if (gameState.turnStartTime) {
                // Active timer - show countdown
                const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
                const remaining = Math.max(0, gameState.turnTimeLimit - elapsed);
                
                // Color coding: green -> yellow -> red as time runs out
                let timerColor = '#00ff00'; // Green
                if (remaining <= 10) {
                    timerColor = '#ff0000'; // Red for last 10 seconds
                } else if (remaining <= 20) {
                    timerColor = '#ffff00'; // Yellow for last 20 seconds
                }
                
                self.timerText.setText(`Time: ${remaining}s`);
                self.timerText.setColor(timerColor);
            } else if (gameState.lastRemainingTime !== null) {
                // Timer stopped (player fired) - show last remaining time frozen
                self.timerText.setText(`Time: ${gameState.lastRemainingTime}s`);
                self.timerText.setColor('#888888'); // Gray color for inactive timer
            } else {
                // Between turns - show dashes
                self.timerText.setText('Time: --');
                self.timerText.setColor('#888888'); // Gray color for inactive timer
            }
        } else {
            self.timerText.setText(''); // No timer when time limit is 0
        }
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
        
        // Get the current active player number (for turn-based highlighting)
        let currentActivePlayer = null;
        if (gameState.playersAlive && gameState.currentPlayerIndex !== undefined) {
            currentActivePlayer = gameState.playersAlive[gameState.currentPlayerIndex];
        }
        
        // Update all player stats
        self.playerElements.forEach(playerElement => {
            const player = gameState[playerElement.playerKey];
            if (player) {
                // Extract player number from playerKey (e.g., 'player1' -> 1)
                const playerNum = parseInt(playerElement.playerKey.replace('player', ''));
                const isActivePlayer = currentActivePlayer === playerNum;
                
                // Update health text
                playerElement.health.setText(`Health: ${player.health}%`);
                
                // Highlight active player by adjusting text styles
                if (isActivePlayer) {
                    // Bold and bright for active player
                    playerElement.title.setStyle({ 
                        fontStyle: 'bold',
                        fontSize: '1rem',
                        color: playerElement.title.style.color // Keep original team color
                    });
                    playerElement.health.setStyle({ 
                        fontStyle: 'bold',
                        fontSize: '1rem',
                        color: '#ffffff' 
                    });
                } else {
                    // Dimmed for inactive players
                    playerElement.title.setStyle({ 
                        fontStyle: 'normal',
                        fontSize: '1rem',
                        color: playerElement.title.style.color // Keep original team color but will appear dimmed due to alpha
                    });
                    playerElement.health.setStyle({ 
                        fontStyle: 'normal',
                        fontSize: '1rem',
                        color: '#888888' // Dimmed gray
                    });
                }
                
                // Set alpha for overall dimming effect
                playerElement.title.setAlpha(isActivePlayer ? 1.0 : 0.6);
                playerElement.health.setAlpha(isActivePlayer ? 1.0 : 0.6);
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
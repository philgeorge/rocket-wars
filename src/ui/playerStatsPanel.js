// playerStatsPanel.js
// Player statistics panel showing health and highlighting active player

import { createBasePanel, positionPanel } from './panelFactory.js';
import { getTeamColorCSS } from '../constants.js';

/**
 * Create a floating player stats panel showing all player information
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} gameState - Game state object containing player data
 * @param {Array} [playerData] - Optional player data with names
 * @returns {Phaser.GameObjects.Container & {updateDisplay: Function, playerElements: Array}}
 */
export function createPlayerStatsPanel(scene, gameState, playerData = null) {
    // Create base panel
    const panel = createBasePanel(scene);
    
    // Calculate panel dimensions
    const numPlayers = gameState.numPlayers || 2;
    const playerHeight = 40;
    const padding = 10;
    const totalHeight = (numPlayers * playerHeight) + (padding * 2);
    const panelWidth = 160;
    
    // Update panel size
    const panelAny = /** @type {any} */ (panel);
    panelAny.updateSize(panelWidth, totalHeight);
    
    // Create player sections dynamically
    const playerElements = [];
    
    for (let i = 1; i <= numPlayers; i++) {
        const yOffset = padding + ((i - 1) * playerHeight);
        const playerKey = `player${i}`;
        const playerColor = getTeamColorCSS(playerKey);
        
        // Use player name from playerData if available, otherwise default
        let playerName = `PLAYER ${i}`;
        if (playerData && playerData[i - 1] && playerData[i - 1].name) {
            playerName = playerData[i - 1].name.toUpperCase();
        }
        
        const playerTitle = scene.add.text(padding, yOffset, playerName, {
            fontSize: '1rem',
            color: playerColor,
            fontStyle: 'bold'
        });
        
        const playerHealth = scene.add.text(padding, yOffset + 18, '', {
            fontSize: '1rem',
            color: '#ffffff'
        });

        playerElements.push({
            playerKey,
            title: playerTitle,
            health: playerHealth
        });

        panel.add([playerTitle, playerHealth]);
    }
    
    panelAny.playerElements = playerElements;
    
    // Method to update the display with current game state
    panelAny.updateDisplay = function(gameState) {
        const self = /** @type {any} */ (this);
        
        // Get the current active player number (for turn-based highlighting)
        let currentActivePlayer = null;
        if (gameState.playersAlive && gameState.currentPlayerIndex !== undefined) {
            currentActivePlayer = gameState.playersAlive[gameState.currentPlayerIndex];
        }
        
        // Update all player stats
        self.playerElements.forEach(playerElement => {
            const player = gameState[playerElement.playerKey];
            if (player) {
                const playerNum = parseInt(playerElement.playerKey.replace('player', ''));
                const isActivePlayer = currentActivePlayer === playerNum;
                
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
    
    return panelAny;
}

/**
 * Position player stats panel at top-right of viewport
 * @param {Phaser.GameObjects.Container} panel - The player stats panel
 * @param {number} viewportWidth - Viewport width
 * @param {number} viewportHeight - Viewport height
 */
export function positionPlayerStatsPanel(panel, viewportWidth, viewportHeight = 600) {
    positionPanel(panel, 'top-right', viewportWidth, viewportHeight, 20);
}

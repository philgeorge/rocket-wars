// resultsPanel.js
// Game results panel for end-of-game display

import { createBasePanel, addPanelText, positionPanel } from './panelFactory.js';
import { getTeamColorCSS } from '../constants.js';

/**
 * Create a floating results panel showing final game results
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} gameState - Game state object
 * @param {Array} playerData - Player data with names
 * @returns {Phaser.GameObjects.Container & {updateDisplay: Function, textElements: Object}}
 */
export function createResultsPanel(scene, gameState, playerData = null) {
    // Create base panel
    const panel = createBasePanel(scene);
    
    // Calculate ranked players (alive > killed, then by health)
    const rankedPlayers = getRankedPlayers(gameState, playerData);
    
    // Define text content starting with title
    const textItems = [
        {
            key: 'title',
            text: 'GAME RESULTS',
            style: {
                fontSize: '1.2rem',
                color: '#00ff00',
                fontStyle: 'bold'
            }
        }
    ];
    
    // Add each player to the results
    rankedPlayers.forEach((player, index) => {
        const position = index + 1;
        const statusIcon = player.isAlive ? '🏆' : '💀';
        const playerName = player.name || `PLAYER ${player.number}`;
        
        textItems.push({
            key: `player${player.number}`,
            text: `${position}. ${statusIcon} ${playerName} (${player.health}%)`,
            style: {
                fontSize: '1rem',
                color: position === 1 ? '#ffd700' : getTeamColorCSS(`player${player.number}`), // Gold for winner
                fontStyle: position === 1 ? 'bold' : 'normal'
            }
        });
    });
    
    // Add restart instruction
    textItems.push({
        key: 'restart',
        text: '',
        style: {
            fontSize: '0.9rem',
            color: '#888888',
            fontStyle: 'italic'
        }
    });
    
    // Add text elements and auto-size panel
    const textElements = addPanelText(scene, panel, textItems, {
        minWidth: 250,
        maxWidth: 400,
        lineHeight: 22
    });
    
    // Store text elements reference
    /** @type {any} */ (panel).textElements = textElements;
    
    // Add restart button functionality (could be expanded later)
    /** @type {any} */ (panel).addRestartButton = function() {
        const self = /** @type {any} */ (this);
        const elements = self.textElements;
        elements.restart.setText('Press R to restart game');
        elements.restart.setInteractive();
        elements.restart.on('pointerdown', () => {
            window.location.reload(); // Simple restart for now
        });
    };
    
    return /** @type {any} */ (panel);
}

/**
 * Get players ranked by game results
 * @param {Object} gameState - Game state object
 * @param {Array} playerData - Player data with names
 * @returns {Array} Ranked player list
 */
function getRankedPlayers(gameState, playerData = null) {
    const players = [];
    
    // Collect all player data
    for (let i = 1; i <= gameState.numPlayers; i++) {
        const playerKey = `player${i}`;
        const player = gameState[playerKey];
        const isAlive = gameState.playersAlive.includes(i);
        
        let playerName = `PLAYER ${i}`;
        if (playerData && playerData[i - 1] && playerData[i - 1].name) {
            playerName = playerData[i - 1].name.toUpperCase();
        }
        
        players.push({
            number: i,
            name: playerName,
            health: player.health,
            isAlive: isAlive,
            kills: player.kills || 0,
            deaths: player.deaths || 0
        });
    }
    
    // Sort players: alive first, then by health descending
    players.sort((a, b) => {
        // Alive players come first
        if (a.isAlive !== b.isAlive) {
            return b.isAlive ? 1 : -1;
        }
        // Then sort by health (highest first)
        return b.health - a.health;
    });
    
    return players;
}

/**
 * Position results panel at center of viewport
 * @param {Phaser.GameObjects.Container} panel - The results panel
 * @param {number} viewportWidth - Viewport width
 * @param {number} viewportHeight - Viewport height
 */
export function positionResultsPanel(panel, viewportWidth, viewportHeight) {
    positionPanel(panel, 'center', viewportWidth, viewportHeight);
}

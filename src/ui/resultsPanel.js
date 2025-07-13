// resultsPanel.js
// Game results panel for end-of-game display

import { createBasePanel, addPanelText, positionPanel } from './panelFactory.js';
import { getRankedPlayers } from '../turnManager.js';
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
        
        // Count how many alive players there are
        const alivePlayers = rankedPlayers.filter(p => p.isAlive);
        const aliveCount = alivePlayers.length;
        
        // Determine trophy/status icon based on position
        let statusIcon;
        if (!player.isAlive) {
            statusIcon = '💀';
        } else {
            // Find position among alive players only
            const alivePosition = alivePlayers.findIndex(p => p.number === player.number) + 1;
            
            // Assign trophies based on position among alive players
            if (alivePosition === 1) {
                statusIcon = '🏆';
            } else if (alivePosition === 2) {
                statusIcon = '🥈';
            } else if (alivePosition === 3) {
                statusIcon = '🥉';
            } else if (alivePosition === aliveCount && aliveCount > 1) {
                // Wooden spoon for lowest-ranked alive player (if more than 1 alive and not first)
                statusIcon = '🥄';
            } else {
                statusIcon = '🏅'; // Generic medal for other positions
            }
        }
        
        const playerName = player.name || `PLAYER ${player.number}`;
        
        textItems.push({
            key: `player${player.number}`,
            text: `${position}. ${statusIcon} ${playerName} (${player.health}%)`,
            style: {
                fontSize: '1rem',
                color: getTeamColorCSS(`player${player.number}`), // Always use team color for text
                fontStyle: position === 1 ? 'bold' : 'normal'
            }
        });
    });
    
    // Add restart instruction
    textItems.push({
        key: 'restart',
        text: 'Click or press Enter to restart...',
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
    
    return /** @type {any} */ (panel);
}

/**
 * Setup restart functionality for the results panel (similar to aiming instructions pattern)
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} panel - The results panel
 */
export function setupResultsPanelRestart(scene, panel) {
    console.log('🎯 Setting up results panel restart functionality');
    
    let restarted = false;
    
    // Function to handle restart
    const handleRestart = () => {
        if (!restarted) {
            restarted = true;
            // Clean up both event listeners
            scene.input.off('pointerdown', handleInput);
            scene.input.keyboard?.off('keydown', handleInput);
            console.log('🔄 Restarting game...');
            window.location.reload();
        }
    };
    
    // Handle both click and key input
    const handleInput = (event) => {
        if (!restarted) {
            // For keyboard events, only respond to Enter key
            if (event.code && event.code !== 'Enter') {
                return;
            }
            handleRestart();
        }
    };
    
    // Set up event listeners
    scene.input.on('pointerdown', handleInput);
    if (scene.input.keyboard) {
        scene.input.keyboard.on('keydown', handleInput);
    }
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

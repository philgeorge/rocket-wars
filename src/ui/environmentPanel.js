// environmentPanel.js
// Environment panel showing round, wind, gravity, and timer

import { createBasePanel, addPanelText, positionPanel } from './panelFactory.js';

/**
 * Create a floating environment panel showing wind and gravity
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} gameState - Game state object containing wind and gravity data
 * @returns {Phaser.GameObjects.Container & {updateDisplay: Function, textElements: Object}}
 */
export function createEnvironmentPanel(scene, gameState) {
    // Create base panel
    const panel = createBasePanel(scene);
    
    // Define text content
    const textItems = [
        {
            key: 'title',
            text: `ROUND ${gameState.currentRound}/${gameState.maxRounds}`,
            style: {
                fontSize: '1rem',
                color: '#00ff00',
                fontStyle: 'bold'
            }
        },
        {
            key: 'wind',
            text: 'Wind: → 0',
            style: {
                fontSize: '1rem',
                color: '#ffffff'
            }
        },
        {
            key: 'gravity',
            text: `Gravity: ${gameState.gravity}`,
            style: {
                fontSize: '1rem',
                color: '#ffffff'
            }
        },
        {
            key: 'timer',
            text: 'Time: --',
            style: {
                fontSize: '1rem',
                color: '#ffff00'
            }
            // Removed custom Y position - let auto-layout handle it
        }
    ];
    
    // Add text elements and auto-size panel
    const textElements = addPanelText(scene, panel, textItems, {
        minWidth: 150,
        maxWidth: 200
    });
    
    // Store text elements reference
    /** @type {any} */ (panel).textElements = textElements;
    
    // Method to update the display with current game state
    /** @type {any} */ (panel).updateDisplay = function(gameState) {
        const self = /** @type {any} */ (this);
        const elements = self.textElements;
        
        // Update title to show current round and max rounds
        elements.title.setText(`ROUND ${gameState.currentRound}/${gameState.maxRounds}`);
        
        // Update wind display with direction indicator
        const windDirection = gameState.wind.current >= 0 ? '→' : '←';
        const windSpeed = Math.abs(gameState.wind.current);
        elements.wind.setText(`Wind: ${windDirection} ${windSpeed}`);
        
        // Update gravity display
        elements.gravity.setText(`Gravity: ${gameState.gravity}`);
        
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
                
                elements.timer.setText(`Time: ${remaining}s`);
                elements.timer.setColor(timerColor);
            } else if (gameState.lastRemainingTime !== null) {
                // Timer stopped (player fired) - show last remaining time frozen
                elements.timer.setText(`Time: ${gameState.lastRemainingTime}s`);
                elements.timer.setColor('#888888'); // Gray color for inactive timer
            } else {
                // Between turns - show dashes
                elements.timer.setText('Time: --');
                elements.timer.setColor('#888888'); // Gray color for inactive timer
            }
        } else {
            elements.timer.setText(''); // No timer when time limit is 0
        }
    };
    
    return /** @type {any} */ (panel);
}

/**
 * Position environment panel at top-left of viewport
 * @param {Phaser.GameObjects.Container} panel - The environment panel
 * @param {number} viewportWidth - Viewport width
 * @param {number} viewportHeight - Viewport height
 */
export function positionEnvironmentPanel(panel, viewportWidth = 800, viewportHeight = 600) {
    positionPanel(panel, 'top-left', viewportWidth, viewportHeight, 20);
}

// environmentPanel.js
// Environment panel showing round, wind, gravity, and timer

import { createBasePanel, addPanelText, addPanelButton, positionPanel } from './panelFactory.js';
import { info } from '../logger.js';
import { getCurrentPlayer } from '../turnManager.js';

/**
 * Create a floating environment panel showing wind and gravity
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} gameState - Game state object containing wind and gravity data
 * @returns {Phaser.GameObjects.Container & {updateDisplay: Function, updateTimer: Function, textElements: Object, teleportButton: Object, updateTeleportButton: Function}}
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
                fontStyle: 'bold',
                color: '#ffff00'
            }
            // Removed custom Y position - let auto-layout handle it
        }
    ];
    
    // Add text elements and auto-size panel
    const textElements = addPanelText(scene, panel, textItems, {
        minWidth: 150,
        maxWidth: 210
    });
    
    // Create teleport button using the reusable button factory
    const buttonSize = 24;
    const buttonX = /** @type {any} */ (panel).panelWidth - buttonSize - 8; // 8px from right edge
    const buttonY = 8; // 8px from top edge
    
    const teleportButton = addPanelButton(scene, panel, {
        x: buttonX,
        y: buttonY,
        width: buttonSize,
        height: buttonSize,
        text: 'T',
        onClick: () => {
            // Toggle teleport mode
            if (/** @type {any} */ (scene).isTeleportMode && /** @type {any} */ (scene).isTeleportMode()) {
                // Currently in teleport mode - exit it
                if (/** @type {any} */ (scene).exitTeleportMode) {
                    const success = /** @type {any} */ (scene).exitTeleportMode();
                    if (success) {
                        info(`↩️ Player exited teleport mode via button`);
                    }
                }
            } else {
                // Not in teleport mode - enter it
                if (/** @type {any} */ (scene).enterTeleportMode) {
                    const success = /** @type {any} */ (scene).enterTeleportMode();
                    if (success) {
                        const currentPlayerNum = getCurrentPlayer(gameState);
                        info(`✅ Player ${currentPlayerNum} entered teleport mode via button`);
                    }
                }
            }
        }
    });
    
    // Store button reference
    /** @type {any} */ (panel).teleportButton = teleportButton;
    
    // Store text elements reference
    /** @type {any} */ (panel).textElements = textElements;
    
    // Store last known values to avoid unnecessary updates
    /** @type {any} */ (panel).lastValues = {
        round: null,
        maxRounds: null,
        windCurrent: null,
        gravity: null,
        lastTimerValue: null
    };
    
    // Method to update the display with current game state (optimized)
    /** @type {any} */ (panel).updateDisplay = function(gameState) {
        const self = /** @type {any} */ (this);
        const elements = self.textElements;
        const lastValues = self.lastValues;
        
        // Only update round if it changed
        if (lastValues.round !== gameState.currentRound || lastValues.maxRounds !== gameState.maxRounds) {
            elements.title.setText(`ROUND ${gameState.currentRound}/${gameState.maxRounds}`);
            lastValues.round = gameState.currentRound;
            lastValues.maxRounds = gameState.maxRounds;
        }
        
        // Only update wind if it changed
        if (lastValues.windCurrent !== gameState.wind.current) {
            const windDirection = gameState.wind.current >= 0 ? '→' : '←';
            const windSpeed = Math.abs(gameState.wind.current);
            elements.wind.setText(`Wind: ${windDirection} ${windSpeed}`);
            lastValues.windCurrent = gameState.wind.current;
        }
        
        // Only update gravity if it changed
        if (lastValues.gravity !== gameState.gravity) {
            elements.gravity.setText(`Gravity: ${gameState.gravity}`);
            lastValues.gravity = gameState.gravity;
        }
        
        // Update timer display (this changes frequently so always update)
        if (gameState.turnTimeLimit > 0) {
            if (gameState.turnStartTime) {
                // Active timer - show countdown
                const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
                const remaining = Math.max(0, gameState.turnTimeLimit - elapsed);
                
                // Only update if timer value changed
                if (lastValues.lastTimerValue !== remaining) {
                    // Color coding: green -> yellow -> red as time runs out
                    let timerColor = '#00ff00'; // Green
                    if (remaining <= 10) {
                        timerColor = '#ff0000'; // Red for last 10 seconds
                    } else if (remaining <= 20) {
                        timerColor = '#ffff00'; // Yellow for last 20 seconds
                    }
                    
                    elements.timer.setText(`Time: ${remaining}s`);
                    elements.timer.setColor(timerColor);
                    lastValues.lastTimerValue = remaining;
                }
            } else if (gameState.lastRemainingTime !== null) {
                // Timer stopped (player fired) - show last remaining time frozen
                const frozenText = `Time: ${gameState.lastRemainingTime}s`;
                if (elements.timer.text !== frozenText) {
                    elements.timer.setText(frozenText);
                    elements.timer.setColor('#888888'); // Gray color for inactive timer
                }
            } else {
                // Between turns - show dashes
                if (elements.timer.text !== 'Time: --') {
                    elements.timer.setText('Time: --');
                    elements.timer.setColor('#888888'); // Gray color for inactive timer
                }
            }
        } else {
            if (elements.timer.text !== '') {
                elements.timer.setText(''); // No timer when time limit is 0
            }
        }
    };
    
    // Method to update only timer (for frequent updates in main loop)
    /** @type {any} */ (panel).updateTimer = function(gameState) {
        const self = /** @type {any} */ (this);
        const elements = self.textElements;
        const lastValues = self.lastValues;
        
        // Update timer display only
        if (gameState.turnTimeLimit > 0 && gameState.turnStartTime) {
            const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
            const remaining = Math.max(0, gameState.turnTimeLimit - elapsed);
            
            // Only update if timer value changed
            if (lastValues.lastTimerValue !== remaining) {
                let timerColor = '#00ff00'; // Green
                if (remaining <= 10) {
                    timerColor = '#ff0000'; // Red for last 10 seconds
                } else if (remaining <= 20) {
                    timerColor = '#ffff00'; // Yellow for last 20 seconds
                }
                
                elements.timer.setText(`Time: ${remaining}s`);
                elements.timer.setColor(timerColor);
                lastValues.lastTimerValue = remaining;
            }
        }
    };
    
    // Method to update teleport button state
    /** @type {any} */ (panel).updateTeleportButton = function(gameState, scene) {
        const self = /** @type {any} */ (this);
        const button = self.teleportButton;
        
        // Determine if button should be disabled (but not when in teleport mode - that's when it's a toggle)
        const shouldDisable = !gameState || 
                             !gameState.playersAlive || 
                             gameState.playersAlive.length === 0 || 
                             !scene.turrets ||
                             scene.currentPlayerTurret || // Player is aiming
                             scene.gameEnded || // Game has ended
                             (scene.projectiles && scene.projectiles.length > 0) || // Projectiles in flight
                             (scene.cameraControls && scene.cameraControls.followingProjectile); // Camera following projectile
        
        const teleportMode = gameState.teleportMode || false;
        
        button.setDisabled(shouldDisable);
        button.draw(false, shouldDisable, teleportMode);
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

// aimingInstructionsPanel.js
// Panel for displaying first-time aiming instructions

import { createBasePanel, addPanelText, positionPanel } from './panelFactory.js';
import { hasShownAimingInstructions, markAimingInstructionsShown } from '../storage.js';

/**
 * Create an aiming instructions panel for first-time players
 * @param {Phaser.Scene} scene - The Phaser scene
 * @returns {Phaser.GameObjects.Container & {panelWidth?: number, panelHeight?: number}}
 */
export function createAimingInstructionsPanel(scene) {
    console.log('🎯 Creating aiming instructions panel...');
    
    // Create base panel using factory
    const panel = createBasePanel(scene);
    
    // Define text content for the panel
    const textItems = [
        {
            key: 'title',
            text: 'AIMING CONTROLS',
            style: {
                fontSize: '1.2rem',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        },
        {
            key: 'instruction1',
            text: 'Aim by clicking or dragging,',
            style: {
                fontSize: '1rem',
                color: '#cccccc'
            }
        },
        {
            key: 'instruction2',
            text: 'or by Enter and arrow keys.',
            style: {
                fontSize: '1rem',
                color: '#cccccc'
            }
        },
        {
            key: 'instruction3',
            text: 'Release click/touch or Enter again to fire!',
            style: {
                fontSize: '1rem',
                color: '#cccccc'
            }
        },
        {
            key: 'instruction4',
            text: 'ESC key to cancel aiming.',
            style: {
                fontSize: '1rem',
                color: '#cccccc'
            }
        },
        {
            key: 'dismiss',
            text: '',
            style: {
                fontSize: '0.9rem',
                color: '#888888'
            }
        },
        {
            key: 'dismissInstruction',
            text: 'Click or press Enter to continue...',
            style: {
                fontSize: '0.9rem',
                color: '#888888',
                fontStyle: 'italic'
            }
        }
    ];
    
    // Add text elements and auto-size panel
    addPanelText(scene, panel, textItems, {
        minWidth: 400,
        maxWidth: 480,
        lineHeight: 24
    });
    
    // Position panel at center of screen
    positionPanel(panel, 'center', scene.cameras.main.width, scene.cameras.main.height);
    
    // Set panel depth to appear above game objects
    panel.setDepth(1000);
    
    console.log('📝 Created aiming instructions panel');
    
    return /** @type {any} */ (panel);
}

/**
 * Hide the aiming instructions panel
 * @param {Object} panel - The panel object
 */
export function hideAimingInstructionsPanel(panel) {
    if (panel && panel.scene) {
        panel.setVisible(false);
        console.log('🙈 Aiming instructions panel hidden');
    }
}

/**
 * Show the aiming instructions panel
 * @param {Object} panel - The panel object
 */
export function showAimingInstructionsPanel(panel) {
    if (panel && panel.scene) {
        panel.setVisible(true);
        console.log('👁️ Aiming instructions panel shown');
    }
}

/**
 * Show aiming instructions panel if it hasn't been shown before
 * @param {Phaser.Scene & {aimingInstructionsPanel?: any}} scene - The Phaser scene
 * @param {Function} [onDismiss] - Optional callback when panel is dismissed
 */
export function showAimingInstructionsIfNeeded(scene, onDismiss = null) {
    // Check if instructions have been shown before
    if (!hasShownAimingInstructions() && scene.aimingInstructionsPanel) {
        console.log('📋 Showing aiming instructions for first time');
        scene.aimingInstructionsPanel.setVisible(true);
        
        // Mark as shown so it won't appear again
        markAimingInstructionsShown();
        
        let dismissed = false;
        
        // Auto-hide after 10 seconds or when user interacts
        const hideInstructions = () => {
            if (!dismissed && scene.aimingInstructionsPanel) {
                dismissed = true;
                hideAimingInstructionsPanel(scene.aimingInstructionsPanel);
                console.log('📋 Aiming instructions dismissed');
                if (onDismiss) {
                    onDismiss();
                }
            }
        };
        
        // Auto-hide after 10 seconds (increased from 5)
        const autoHideTimer = scene.time.delayedCall(10000, hideInstructions);
        
        // Hide when user clicks anywhere on screen
        const handleClick = () => {
            if (!dismissed) {
                autoHideTimer.remove(); // Cancel auto-hide timer
                hideInstructions();
                scene.input.off('pointerdown', handleClick);
            }
        };
        
        // Hide when user presses Enter key
        const handleEnterKey = (event) => {
            if (!dismissed && event.code === 'Enter') {
                autoHideTimer.remove(); // Cancel auto-hide timer
                hideInstructions();
                scene.input.keyboard?.off('keydown', handleEnterKey);
            }
        };
        
        // Set up event listeners
        scene.input.once('pointerdown', handleClick);
        if (scene.input.keyboard) {
            scene.input.keyboard.on('keydown', handleEnterKey);
        }
        
        return true; // Panel was shown
    }
    
    return false; // Panel was not shown (already seen before)
}

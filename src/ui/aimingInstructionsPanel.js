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
            text: 'Release mouse/touch or Enter again to fire!',
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
        }
    ];
    
    // Add text elements and auto-size panel
    addPanelText(scene, panel, textItems, {
        minWidth: 320,
        maxWidth: 400,
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
 */
export function showAimingInstructionsIfNeeded(scene) {
    // Check if instructions have been shown before
    if (!hasShownAimingInstructions() && scene.aimingInstructionsPanel) {
        console.log('📋 Showing aiming instructions for first time');
        scene.aimingInstructionsPanel.setVisible(true);
        
        // Mark as shown so it won't appear again
        markAimingInstructionsShown();
        
        // Auto-hide after 5 seconds or when user presses a key/clicks
        const hideInstructions = () => {
            if (scene.aimingInstructionsPanel) {
                hideAimingInstructionsPanel(scene.aimingInstructionsPanel);
                console.log('📋 Aiming instructions auto-hidden');
            }
        };
        
        // Auto-hide after 5 seconds
        scene.time.delayedCall(5000, hideInstructions);
        
        // Hide when user interacts (click or keypress)
        const handleInteraction = () => {
            hideInstructions();
            scene.input.off('pointerdown', handleInteraction);
            scene.input.keyboard?.off('keydown', handleInteraction);
        };
        
        scene.input.once('pointerdown', handleInteraction);
        if (scene.input.keyboard) {
            scene.input.keyboard.once('keydown', handleInteraction);
        }
    }
}

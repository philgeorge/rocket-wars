// aimingInstructionsPanel.js
// Panel for displaying aiming instructions at the start of each game

import { createBasePanel, addPanelText, positionPanel } from './panelFactory.js';

/**
 * Create an aiming instructions panel for players at the start of each game
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
            text: 'AIMING CONTROLS',
            style: {
                fontSize: '1.2rem',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        },
        {
            text: 'Click and drag,',
            style: {
                fontSize: '1rem',
                color: '#cccccc'
            }
        },
        {
            text: 'then release to fire.',
            style: {
                fontSize: '1rem',
                color: '#cccccc'
            }
        },
        {
            text: 'Keyboard: Enter and arrow keys,',
            style: {
                fontSize: '1rem',
                color: '#cccccc'
            }
        },
        {
            text: 'then Enter again to fire!',
            style: {
                fontSize: '1rem',
                color: '#cccccc'
            }
        },
        {
            text: 'ESC to cancel aiming.',
            style: {
                fontSize: '1rem',
                color: '#cccccc'
            }
        },
        {
            text: ''
        },
        {
            text: 'Click "T" button to teleport',
            style: {
                fontSize: '0.9rem',
                color: '#00ff00'
            }
        },
        {
            text: '(and again to cancel).',
            style: {
                fontSize: '0.9rem',
                color: '#00ff00'
            }
        },
        {
            text: 'Or press "T" key (again to cancel).',
            style: {
                fontSize: '0.9rem',
                color: '#00ff00'
            }
        },
        {
            text: ''
        },
        {
            text: 'Click to continue.',
            style: {
                fontSize: '0.9rem',
                color: '#888888',
                fontStyle: 'italic'
            }
        },
        {
            text: 'Or press any key.',
            style: {
                fontSize: '0.9rem',
                color: '#888888',
                fontStyle: 'italic'
            }
        }
    ];
    
    // Add text elements and auto-size panel
    addPanelText(scene, panel, textItems, {
        minWidth: 300,
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
 * Show aiming instructions panel at the start of each game
 * @param {Phaser.Scene & {aimingInstructionsPanel?: any}} scene - The Phaser scene
 * @param {Function} [onDismiss] - Optional callback when panel is dismissed
 */
export function showAimingInstructionsIfNeeded(scene, onDismiss = null) {
    // Always show instructions at the start of each game
    if (scene.aimingInstructionsPanel) {
        console.log('📋 Showing aiming instructions for this game');
        scene.aimingInstructionsPanel.setVisible(true);
        
        let dismissed = false;
        
        // Auto-hide after 10 seconds or when user interacts
        const hideInstructions = () => {
            if (!dismissed && scene.aimingInstructionsPanel) {
                dismissed = true;
                // Clean up both event listeners
                scene.input.off('pointerdown', handleInput);
                scene.input.keyboard?.off('keydown', handleInput);
                hideAimingInstructionsPanel(scene.aimingInstructionsPanel);
                console.log('📋 Aiming instructions dismissed');
                if (onDismiss) {
                    onDismiss();
                }
            }
        };
        
        // Auto-hide after 10 seconds (increased from 5)
        const autoHideTimer = scene.time.delayedCall(20000, hideInstructions);
        
        // Handle both click and key input
        const handleInput = (event) => {
            if (!dismissed) {
                // For keyboard events, only respond to Enter key
                if (event.code && event.code !== 'Enter') {
                    return;
                }
                autoHideTimer.remove(); // Cancel auto-hide timer
                hideInstructions();
            }
        };
        
        // Set up event listeners
        scene.input.once('pointerdown', handleInput);
        if (scene.input.keyboard) {
            scene.input.keyboard.on('keydown', handleInput);
        }
        
        return true; // Panel was shown
    }
    
    return false; // Panel was not shown (no panel available)
}

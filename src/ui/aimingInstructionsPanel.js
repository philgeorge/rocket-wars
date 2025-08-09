// aimingInstructionsPanel.js
// Panel for displaying aiming instructions at the start of each game

import { createBasePanel, addPanelText, positionPanel, setupPanelInputDismissal } from './panelFactory.js';
import { info, trace } from '../logger.js';

/**
 * Create an aiming instructions panel for players at the start of each game
 * @param {Phaser.Scene} scene - The Phaser scene
 * @returns {Phaser.GameObjects.Container & {panelWidth?: number, panelHeight?: number}}
 */
export function createAimingInstructionsPanel(scene) {
    info('🎯 Creating aiming instructions panel...');
    
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
    
    // Create base panel
    const panel = createBasePanel(scene);
    
    // Add text content and auto-size panel
    addPanelText(scene, panel, textItems, {
        minWidth: 300,
        maxWidth: 400,
        lineHeight: 24
    });
    
    // Position panel at center
    positionPanel(panel, 'center', scene.cameras.main.width, scene.cameras.main.height);
    
    // Set panel depth and initially hidden
    panel.setDepth(1000);
    panel.setVisible(false);
    
    trace('📝 Created aiming instructions panel');
    
    return /** @type {any} */ (panel);
}

/**
 * Hide the aiming instructions panel
 * @param {Object} panel - The panel object
 */
export function hideAimingInstructionsPanel(panel) {
    if (panel && panel.scene) {
        panel.setVisible(false);
        trace('🙈 Aiming instructions panel hidden');
    }
}

/**
 * Show the aiming instructions panel
 * @param {Object} panel - The panel object
 */
export function showAimingInstructionsPanel(panel) {
    if (panel && panel.scene) {
        panel.setVisible(true);
        trace('👁️ Aiming instructions panel shown');
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
        info('📋 Showing aiming instructions for this game');
        scene.aimingInstructionsPanel.setVisible(true);
        
        // Use the reusable utility function for input handling
        setupPanelInputDismissal(scene, () => {
            hideAimingInstructionsPanel(scene.aimingInstructionsPanel);
            info('📋 Aiming instructions dismissed');
            if (onDismiss) {
                onDismiss();
            }
        }, {
            includeKeyboard: true,
            once: true, // Use 'once' for pointer, but 'on' for keyboard as in original
            autoHideDelay: 20000 // 20 second auto-hide
        });
        
        return true; // Panel was shown
    }
    
    return false; // Panel was not shown (no panel available)
}

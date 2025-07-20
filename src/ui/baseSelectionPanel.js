// baseSelectionPanel.js
// Phaser-based base selection panel to avoid DOM event conflicts

import { getTeamColorName, getTeamColorCSS } from '../constants.js';
import { createBasePanel, addPanelText } from './panelFactory.js';
import { shouldUseMobilePositioning } from '../deviceDetection.js';

/**
 * Create a Phaser-based base selection panel for a specific player
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} currentPlayer - Current player data
 * @returns {Phaser.GameObjects.Container & {panelWidth?: number, panelHeight?: number}}
 */
export function createBaseSelectionPanel(scene, currentPlayer) {
    console.log(`🎮 Creating base selection panel for ${currentPlayer.name}...`);
    
    // Create base panel using factory
    const panel = createBasePanel(scene);
    
    // Get player-specific styling
    const playerColorName = getTeamColorName(currentPlayer.team);
    const playerColorCSS = getTeamColorCSS(currentPlayer.team);

    // Define text content for the panel
    const textItems = [
        {
            text: `${currentPlayer.name.toUpperCase()}`,
            style: {
                fontSize: '1rem',
                color: playerColorCSS,
                fontStyle: 'bold'
            }
        },
        {
            text: `Click a ${playerColorName.toLowerCase()} circle`,
            style: {
                fontSize: '1rem',
                color: playerColorCSS
            }
        },
        {
            text: `to position your base.`,
            style: {
                fontSize: '1rem',
                color: playerColorCSS
            }
        },
        {
            text: `Or use Tab and Enter keys.`,
            style: {
                fontSize: '1rem',
                color: playerColorCSS
            }
        }
    ];
    
    // Add text elements and auto-size panel
    addPanelText(scene, panel, textItems, {
        minWidth: 280,
        maxWidth: 320,
        lineHeight: 22
    });
    
    // Position panel at top-center of screen
    positionBaseSelectionPanel(panel, scene.cameras.main.width);
    
    // Set panel depth to appear above game objects
    panel.setDepth(1000);
    
    console.log(`📝 Created panel for ${currentPlayer.name} (${playerColorName}) with color ${playerColorCSS}`);
    
    return /** @type {any} */ (panel);
}


/**
 * Position the base selection panel on screen
 * @param {Object} panel - The panel object
 * @param {number} screenWidth - Current screen width
 * @param {boolean} [isTeleportMode] - Whether this is teleport mode (positions lower on mobile)
 */
export function positionBaseSelectionPanel(panel, screenWidth, isTeleportMode = false) {
    // Use the factory's positioning utility with custom positioning
    const panelWidth = /** @type {any} */ (panel).panelWidth || 280;
    const panelX = (screenWidth - panelWidth) / 2; // Center horizontally
    
    // Adjust Y position based on mode and screen size
    let panelY = 20; // Default: 20px from top
    
    if (isTeleportMode && shouldUseMobilePositioning()) {
        // On mobile devices during teleport, position lower to avoid overlap with environment panel
        panelY += 180; // Move down to avoid UI overlap
        console.log(`📱 Positioning teleport panel lower for mobile (Y=${panelY})`);
    }
    
    panel.setPosition(panelX, panelY);
}

/**
 * Hide the base selection panel
 * @param {Object} panel - The panel object
 */
export function hideBaseSelectionPanel(panel) {
    if (panel && panel.scene) {
        panel.setVisible(false);
        console.log('🙈 Base selection panel hidden');
    }
}

/**
 * Show the base selection panel
 * @param {Object} panel - The panel object
 */
export function showBaseSelectionPanel(panel) {
    if (panel && panel.scene) {
        panel.setVisible(true);
        console.log('👁️ Base selection panel shown');
    }
}

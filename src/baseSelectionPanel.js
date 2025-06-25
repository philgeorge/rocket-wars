// baseSelectionPanel.js
// Phaser-based base selection panel to avoid DOM event conflicts

import { getTeamColorName, getTeamColorHex, getTeamColorCSS } from './constants.js';

/**
 * Create a Phaser-based base selection panel for a specific player
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} currentPlayer - Current player data
 * @param {number} playerIndex - Current player index (0-based)
 * @param {number} totalPlayers - Total number of players
 * @returns {Object} Panel object
 */
export function createBaseSelectionPanel(scene, currentPlayer, playerIndex, totalPlayers) {
    console.log(`🎮 Creating base selection panel for ${currentPlayer.name}...`);
    
    // Create container for the panel
    const panel = scene.add.container(0, 0);
    
    // Create background panel (match other panels size and style)
    const panelWidth = 340;
    const panelHeight = 85;
    const background = scene.add.graphics();
    background.fillStyle(0x000000, 0.8); // Match environment panel background
    background.lineStyle(2, 0xffffff, 0.6); // Match environment panel border
    background.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    background.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    
    // Get player-specific styling
    const playerColorName = getTeamColorName(currentPlayer.team);
    const playerColorCSS = getTeamColorCSS(currentPlayer.team);
    const progressText = `(${playerIndex + 1} of ${totalPlayers})`;
    
    // Create title text with player-specific information
    const titleText = scene.add.text(10, 10, `${progressText} ${currentPlayer.name.toUpperCase()}`, {
        fontSize: '1rem',
        color: playerColorCSS,
        fontStyle: 'bold'
    });
    
    // Create instruction text with player-specific color
    const instructionText = scene.add.text(10, 32, `Click a ${playerColorName.toLowerCase()} circle\nto position your base.`, {
        fontSize: '1rem',
        color: playerColorCSS
    });
    
    // Add all elements to container
    panel.add([background, titleText, instructionText]);
    
    // Position panel at top-center of screen
    positionBaseSelectionPanel(panel, scene.cameras.main.width, panelWidth);
    
    // Set panel depth to appear above game objects
    panel.setDepth(1000);
    
    // Store width for positioning (cast to any to avoid TypeScript errors)
    const panelAny = /** @type {any} */ (panel);
    panelAny.panelWidth = panelWidth;
    
    console.log(`📝 Created panel for ${currentPlayer.name} (${playerColorName}) with color ${playerColorCSS}`);
    
    return panel;
}


/**
 * Position the base selection panel at the top center of the screen
 * @param {Object} panel - The panel container
 * @param {number} screenWidth - Current screen width
 * @param {number} [panelWidth] - Panel width (optional, will try to get from panel if not provided)
 */
export function positionBaseSelectionPanel(panel, screenWidth, panelWidth) {
    // Use provided width or try to get from panel, fallback to default
    const actualPanelWidth = panelWidth || (/** @type {any} */ (panel)).panelWidth || 340;
    
    const panelX = (screenWidth - actualPanelWidth) / 2; // Center horizontally
    const panelY = 20; // 20px from top
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

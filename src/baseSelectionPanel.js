// baseSelectionPanel.js
// Phaser-based base selection panel to avoid DOM event conflicts

import { getTeamColorName, getTeamColorHex, getTeamColorCSS } from './constants.js';

/**
 * Create a Phaser-based base selection panel
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Array} playerData - Array of player data objects
 * @returns {Object} Panel object with update methods
 */
export function createBaseSelectionPanel(scene, playerData) {
    console.log('🎮 Creating Phaser-based base selection panel...');
    
    // Create container for the panel
    const panel = scene.add.container(0, 0);
    
    // Create background panel (match other panels size and style)
    const panelWidth = 340; // Reduced by 60px from 400px
    const panelHeight = 85; // Reduced by 10px from 95px
    const background = scene.add.graphics();
    background.fillStyle(0x000000, 0.8); // Match environment panel background
    background.lineStyle(2, 0xffffff, 0.6); // Match environment panel border
    background.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    background.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    
    // Create title text (matching environment panel style)
    const titleText = scene.add.text(10, 10, 'BASE SELECTION', {
        fontSize: '1rem',
        color: '#ffffff',
        fontStyle: 'bold'
    });
    
    // Create instruction text (single line, matching environment panel style)
    const instructionText = scene.add.text(10, 32, 'Click a coloured circle\nto position your base.', {
        fontSize: '1rem',
        color: '#ffffff'
    });
    
    // Add all elements to container
    panel.add([background, titleText, instructionText]);
    
    // Position panel at top-center of screen
    positionBaseSelectionPanel(panel, scene.cameras.main.width);
    
    // Set panel depth to appear above game objects
    panel.setDepth(1000);
    
    // Store references for updates (cast to any to avoid TypeScript errors)
    const panelAny = /** @type {any} */ (panel);
    panelAny.titleText = titleText;
    panelAny.instructionText = instructionText;
    panelAny.background = background;
    panelAny.panelWidth = panelWidth;
    panelAny.panelHeight = panelHeight;
    
    return panel;
}

/**
 * Update the base selection panel for current player
 * @param {Object} panel - The panel object
 * @param {Object} currentPlayer - Current player data
 * @param {number} playerIndex - Current player index (0-based)
 * @param {number} totalPlayers - Total number of players
 */
export function updateBaseSelectionPanel(panel, currentPlayer, playerIndex, totalPlayers) {
    const playerColorName = getTeamColorName(currentPlayer.team);
    const progressText = `(${playerIndex + 1} of ${totalPlayers})`;
    
    // Cast panel to any to access custom properties
    const panelAny = /** @type {any} */ (panel);
    
    // Update title with shorter format: "(n of n) Player Name"
    panelAny.titleText.setText(`${progressText} ${currentPlayer.name.toUpperCase()}`);
    
    // Get player color for styling - use the CSS format for text
    const playerColorCSS = getTeamColorCSS(currentPlayer.team);
    
    panelAny.background.clear();
    panelAny.background.fillStyle(0x000000, 0.8); // Match environment panel background
    panelAny.background.lineStyle(2, 0xffffff, 0.6); // Match environment panel border
    panelAny.background.fillRoundedRect(0, 0, panelAny.panelWidth, panelAny.panelHeight, 8);
    panelAny.background.strokeRoundedRect(0, 0, panelAny.panelWidth, panelAny.panelHeight, 8);
    
    // Update title color to match player
    panelAny.titleText.setColor(playerColorCSS);
    
    // Update instruction text with player's color: "Click a {color} circle to position your base."
    panelAny.instructionText.setText(`Click a ${playerColorName.toLowerCase()} circle\nto position your base.`);
    panelAny.instructionText.setColor(playerColorCSS);
    
    console.log(`📝 Updated panel for ${currentPlayer.name} (${playerColorName}) with color ${playerColorCSS}`);
}

/**
 * Position the base selection panel at the top center of the screen
 * @param {Object} panel - The panel container
 * @param {number} screenWidth - Current screen width
 */
export function positionBaseSelectionPanel(panel, screenWidth) {
    // Cast panel to any to access custom properties
    const panelAny = /** @type {any} */ (panel);
    const panelWidth = panelAny.panelWidth || 400; // Fallback to default width
    
    const panelX = (screenWidth - panelWidth) / 2; // Center horizontally
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

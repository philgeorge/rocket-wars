// baseSelectionPanel.js
// Phaser-based base selection panel to avoid DOM event conflicts

import { getTeamColorName } from './constants.js';

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
    
    // Create background panel
    const panelWidth = 400;
    const panelHeight = 120;
    const background = scene.add.graphics();
    background.fillStyle(0x1a1a1a, 0.9);
    background.lineStyle(3, 0xffffff, 0.8);
    background.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);
    background.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);
    
    // Create title text
    const titleText = scene.add.text(panelWidth / 2, 25, 'BASE SELECTION', {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    
    // Create instruction text
    const instructionText = scene.add.text(panelWidth / 2, 55, 'Find a position for your base.', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#cccccc',
        align: 'center'
    }).setOrigin(0.5, 0.5);
    
    // Create action text
    const actionText = scene.add.text(panelWidth / 2, 85, 'Click a coloured circle to select.', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center'
    }).setOrigin(0.5, 0.5);
    
    // Add all elements to container
    panel.add([background, titleText, instructionText, actionText]);
    
    // Position panel at top-center of screen
    positionBaseSelectionPanel(panel, scene.cameras.main.width);
    
    // Set panel depth to appear above game objects
    panel.setDepth(1000);
    
    // Store references for updates (cast to any to avoid TypeScript errors)
    const panelAny = /** @type {any} */ (panel);
    panelAny.titleText = titleText;
    panelAny.instructionText = instructionText;
    panelAny.actionText = actionText;
    panelAny.background = background;
    
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
    
    // Update title with player info
    panelAny.titleText.setText(`${progressText} ${currentPlayer.name.toUpperCase()} - ${playerColorName.toUpperCase()} BASE`);
    
    // Update border color to match player
    const playerColorHex = getTeamColorHex(currentPlayer.team);
    panelAny.background.clear();
    panelAny.background.fillStyle(0x1a1a1a, 0.9);
    panelAny.background.lineStyle(3, playerColorHex, 0.8);
    panelAny.background.fillRoundedRect(0, 0, 400, 120, 8);
    panelAny.background.strokeRoundedRect(0, 0, 400, 120, 8);
    
    // Update title color
    panelAny.titleText.setColor(`#${playerColorHex.toString(16).padStart(6, '0')}`);
    
    // Update action text to mention the player's color
    panelAny.actionText.setText(`Click a ${playerColorName.toLowerCase()} circle to select.`);
    
    console.log(`📝 Updated panel for ${currentPlayer.name} (${playerColorName})`);
}

/**
 * Position the base selection panel at the top center of the screen
 * @param {Object} panel - The panel container
 * @param {number} screenWidth - Current screen width
 */
export function positionBaseSelectionPanel(panel, screenWidth) {
    const panelX = (screenWidth - 400) / 2; // Center horizontally
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

/**
 * Convert team name to hex color for Phaser
 * @param {string} team - Team name
 * @returns {number} Hex color value
 */
function getTeamColorHex(team) {
    const colorMap = {
        'red': 0xff6b6b,
        'blue': 0x6bb6ff,
        'green': 0x6bff6b,
        'yellow': 0xffff6b,
        'purple': 0xb66bff,
        'orange': 0xff966b,
        'cyan': 0x6bffff,
        'pink': 0xff6bff
    };
    return colorMap[team] || 0xffffff;
}

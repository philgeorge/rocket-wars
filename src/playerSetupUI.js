// playerSetupUI.js
// UI components for the player setup stage in Rocket Wars

/**
 * Create a floating player setup panel
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {Object} setupState - Setup state object
 * @param {Object} gameConfig - Game configuration from form
 * @returns {Object} Setup panel object with methods
 */
export function createPlayerSetupPanel(scene, setupState, gameConfig) {
    console.log('🖼️ Creating player setup UI panel...');
    
    // Create main container positioned at center-top of screen
    const panel = scene.add.container(0, 0);
    
    // Panel dimensions
    const panelWidth = 400;
    const panelHeight = 120;
    
    // Create background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.9); // Darker background for better visibility
    bg.lineStyle(3, 0x00ff00, 1); // Bright green border
    bg.fillRoundedRect(0, 0, panelWidth, panelHeight, 12);
    bg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 12);
    
    // Title text
    const titleText = scene.add.text(panelWidth / 2, 20, 'PLAYER SETUP', {
        fontSize: '1.2rem',
        color: '#00ff00',
        fontStyle: 'bold',
        align: 'center'
    }).setOrigin(0.5, 0.5);
    
    // Instruction text (will be updated per player)
    const instructionText = scene.add.text(panelWidth / 2, 50, '', {
        fontSize: '1rem',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelWidth - 40 }
    }).setOrigin(0.5, 0.5);
    
    // Progress text (Player X of Y)
    const progressText = scene.add.text(panelWidth / 2, 80, '', {
        fontSize: '0.9rem',
        color: '#cccccc',
        align: 'center'
    }).setOrigin(0.5, 0.5);
    
    // Temporary "Continue" button for Phase 1 testing
    const continueButton = scene.add.graphics();
    continueButton.fillStyle(0x4CAF50, 1);
    continueButton.lineStyle(2, 0x66BB6A, 1);
    continueButton.fillRoundedRect(panelWidth - 120, panelHeight - 35, 100, 25, 5);
    continueButton.strokeRoundedRect(panelWidth - 120, panelHeight - 35, 100, 25, 5);
    
    const continueButtonText = scene.add.text(panelWidth - 70, panelHeight - 22, 'Continue', {
        fontSize: '0.8rem',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    
    // Make button interactive
    continueButton.setInteractive(new Phaser.Geom.Rectangle(panelWidth - 120, panelHeight - 35, 100, 25), Phaser.Geom.Rectangle.Contains);
    continueButton.on('pointerdown', () => {
        if (panel.onPlayerComplete) {
            // For Phase 1, just use default player data
            const currentPlayer = setupState.players[setupState.currentPlayerIndex];
            panel.onPlayerComplete(currentPlayer);
        }
    });
    
    // Add hover effects for better UX
    continueButton.on('pointerover', () => {
        continueButton.clear();
        continueButton.fillStyle(0x66BB6A, 1);
        continueButton.lineStyle(2, 0x81C784, 1);
        continueButton.fillRoundedRect(panelWidth - 120, panelHeight - 35, 100, 25, 5);
        continueButton.strokeRoundedRect(panelWidth - 120, panelHeight - 35, 100, 25, 5);
    });
    
    continueButton.on('pointerout', () => {
        continueButton.clear();
        continueButton.fillStyle(0x4CAF50, 1);
        continueButton.lineStyle(2, 0x66BB6A, 1);
        continueButton.fillRoundedRect(panelWidth - 120, panelHeight - 35, 100, 25, 5);
        continueButton.strokeRoundedRect(panelWidth - 120, panelHeight - 35, 100, 25, 5);
    });
    
    // Add all elements to container
    panel.add([bg, titleText, instructionText, progressText, continueButton, continueButtonText]);
    
    // Keep panel fixed on screen regardless of camera movement
    panel.setScrollFactor(0);
    
    // Position panel at center-top of screen
    positionPanel(panel, scene.cameras.main.width, panelWidth, panelHeight);
    
    // Store references to UI elements
    panel.instructionText = instructionText;
    panel.progressText = progressText;
    panel.onPlayerComplete = null; // Will be set by playerSetup.js
    
    // Panel methods
    panel.showForPlayer = function(playerData, playerNumber, totalPlayers) {
        console.log(`📋 Showing setup panel for ${playerData.id}`);
        
        // Update instruction text
        this.instructionText.setText(`${playerData.name}, get ready for setup!\n(Phase 1: Basic UI Test)`);
        
        // Update progress text
        this.progressText.setText(`Player ${playerNumber} of ${totalPlayers}`);
        
        // Make panel visible
        this.setVisible(true);
    };
    
    panel.hide = function() {
        console.log('🚫 Hiding player setup panel');
        this.setVisible(false);
        
        // Clean up any event listeners or resources if needed
        if (continueButton) {
            continueButton.removeAllListeners();
        }
    };
    
    // Initially hidden
    panel.setVisible(false);
    
    return panel;
}

/**
 * Position the setup panel at the center-top of the viewport
 * @param {Phaser.GameObjects.Container} panel - The panel container
 * @param {number} screenWidth - Current screen width
 * @param {number} panelWidth - Panel width
 * @param {number} panelHeight - Panel height
 */
function positionPanel(panel, screenWidth, panelWidth, panelHeight) {
    const x = (screenWidth / 2) - (panelWidth / 2);
    const y = 20; // 20px from top
    
    panel.setPosition(x, y);
    console.log(`📍 Positioned setup panel at (${x}, ${y})`);
}

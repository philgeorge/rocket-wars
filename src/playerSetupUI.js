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
    const panelHeight = 160; // Increased height for name input
    
    // Create background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.9); // Darker background for better visibility
    bg.lineStyle(3, 0x00ff00, 1); // Bright green border
    bg.fillRoundedRect(0, 0, panelWidth, panelHeight, 12);
    bg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 12);
    
    // Make sure background doesn't interfere with input (explicitly non-interactive)
    bg.setInteractive(false);
    
    // Title text
    const titleText = scene.add.text(panelWidth / 2, 20, 'PLAYER SETUP', {
        fontSize: '1.2rem',
        color: '#00ff00',
        fontStyle: 'bold',
        align: 'center'
    }).setOrigin(0.5, 0.5);
    
    // Instruction text (will be updated per player)
    const instructionText = scene.add.text(panelWidth / 2, 45, '', {
        fontSize: '0.9rem',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelWidth - 40 }
    }).setOrigin(0.5, 0.5);
    
    // Name input label
    const nameLabel = scene.add.text(20, 70, 'Enter your name:', {
        fontSize: '0.9rem',
        color: '#ffff99',
        fontStyle: 'bold'
    });
    
    // Name input background (to simulate input field)
    const nameInputBg = scene.add.graphics();
    nameInputBg.fillStyle(0xffffff, 1);
    nameInputBg.lineStyle(2, 0x00ff00, 1);
    nameInputBg.fillRoundedRect(140, 62, 200, 24, 4);
    nameInputBg.strokeRoundedRect(140, 62, 200, 24, 4);
    
    // Name input text display
    const nameInputText = scene.add.text(145, 74, '', {
        fontSize: '0.9rem',
        color: '#000000',
        fontFamily: 'monospace'
    }).setOrigin(0, 0.5);
    
    // Cursor for text input
    const cursor = scene.add.text(145, 74, '|', {
        fontSize: '0.9rem',
        color: '#000000',
        fontFamily: 'monospace'
    }).setOrigin(0, 0.5);
    
    // Animate cursor blinking
    scene.tweens.add({
        targets: cursor,
        alpha: 0,
        duration: 500,
        yoyo: true,
        repeat: -1
    });
    
    // Progress text (Player X of Y)
    const progressText = scene.add.text(panelWidth / 2, 110, '', {
        fontSize: '0.9rem',
        color: '#cccccc',
        align: 'center'
    }).setOrigin(0.5, 0.5);
    
    // Status text for instructions
    const statusText = scene.add.text(panelWidth / 2, 130, '', {
        fontSize: '0.8rem',
        color: '#99ccff',
        align: 'center',
        fontStyle: 'italic'
    }).setOrigin(0.5, 0.5);
    
    // "Ready" button (replaces Continue button, only enabled when name is entered)
    const readyButton = scene.add.graphics();
    const buttonX = panelWidth - 120;
    const buttonY = panelHeight - 25;
    const buttonWidth = 100;
    const buttonHeight = 20;
    
    readyButton.fillStyle(0x4CAF50, 1);
    readyButton.lineStyle(2, 0x66BB6A, 1);
    readyButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 4);
    readyButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 4);
    
    const readyButtonText = scene.add.text(panelWidth - 70, panelHeight - 15, 'Ready', {
        fontSize: '0.8rem',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    
    // TEMPORARY SIMPLIFICATION: Make the entire panel background interactive for testing
    const tempClickArea = scene.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth - 40, panelHeight - 40, 0x000000, 0);
    console.log('🔧 Setting up temporary simplified click area...');
    try {
        tempClickArea.setInteractive();
        console.log('✅ Temporary click area set up successfully');
        
        tempClickArea.on('pointerdown', () => {
            console.log('🖱️ Temporary click area activated');
            if (panel.onPlayerComplete && panel.currentPlayerData) {
                // Get the name from our text input
                const enteredName = panel.currentNameText || '';
                if (enteredName.trim().length === 0) {
                    panel.currentPlayerData.name = `Player ${panel.currentPlayerIndex + 1}`; // Default name
                } else {
                    panel.currentPlayerData.name = enteredName.trim();
                }
                
                console.log(`✅ Player ${panel.currentPlayerIndex + 1} name set to: "${panel.currentPlayerData.name}"`);
                panel.onPlayerComplete(panel.currentPlayerData);
            }
        });
    } catch (error) {
        console.error('❌ Error setting up temporary click area:', error);
    }
    
    // Add all elements to container
    panel.add([bg, titleText, instructionText, nameLabel, nameInputBg, nameInputText, cursor, progressText, statusText, readyButton, readyButtonText, tempClickArea]);
    
    // Keep panel fixed on screen regardless of camera movement
    panel.setScrollFactor(0);
    
    // Position panel at center-top of screen
    positionPanel(panel, scene.cameras.main.width, panelWidth, panelHeight);
    
    // Store references to UI elements
    panel.instructionText = instructionText;
    panel.progressText = progressText;
    panel.statusText = statusText;
    panel.nameInputText = nameInputText;
    panel.cursor = cursor;
    panel.currentPlayerData = null;
    panel.currentPlayerIndex = 0;
    panel.currentNameText = ''; // Store the current text being typed
    panel.onPlayerComplete = null; // Will be set by playerSetup.js
    
    // Set up keyboard input for name typing
    setupKeyboardInput(scene, panel, nameInputText, cursor);
    
    // Panel methods
    panel.showForPlayer = function(playerData, playerNumber, totalPlayers) {
        console.log(`📋 Showing setup panel for ${playerData.id}`);
        
        // Store current player data
        this.currentPlayerData = playerData;
        this.currentPlayerIndex = playerNumber - 1; // Store 0-based index
        
        // Reset name input
        this.currentNameText = playerData.name.startsWith('Player ') ? '' : playerData.name;
        updateNameDisplay(this, this.nameInputText, this.cursor);
        
        // Update instruction text for Phase 2
        this.instructionText.setText(`${playerData.team.toUpperCase()}: Enter your name (optional), then click a base`);
        
        // Update progress text
        this.progressText.setText(`Player ${playerNumber} of ${totalPlayers}`);
        
        // Update status text
        this.statusText.setText('TEMPORARY: Click anywhere in the dark panel area to continue');
        
        // Make panel visible
        this.setVisible(true);
    };
    
    panel.hide = function() {
        console.log('🚫 Hiding player setup panel');
        this.setVisible(false);
        
        // Reset name input
        this.currentNameText = '';
        if (this.nameInputText) {
            this.nameInputText.setText('');
        }
        
        // Clean up keyboard event listener
        if (this.keyboardHandler && scene.input.keyboard) {
            scene.input.keyboard.off('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
        
        // Clean up any other event listeners
        if (tempClickArea) {
            tempClickArea.removeAllListeners();
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

/**
 * Create base selection visual system
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {Array} availableBases - Array of available base indices
 * @param {Array} flatBases - Array of all flat base locations
 * @param {Object} setupPanel - The setup panel reference
 * @returns {Object} Base selection system with methods
 */
export function createBaseSelectionSystem(scene, availableBases, flatBases, setupPanel) {
    console.log('🎯 Creating base selection system...');
    
    const baseHighlights = [];
    const baseClickAreas = [];
    
    // Create highlight graphics for each available base
    availableBases.forEach(baseIndex => {
        const baseData = flatBases[baseIndex];
        
        // Create highlight circle
        const highlight = scene.add.graphics();
        highlight.lineStyle(4, 0x00ff00, 0.8); // Green highlight
        highlight.strokeCircle(0, 0, 25); // 25px radius
        highlight.setPosition(baseData.x, baseData.y - 15); // Position above base
        highlight.setVisible(true);
        highlight.setAlpha(0.7);
        
        // TEMPORARILY DISABLED: Create click area using invisible rectangle instead of zone
        // const clickArea = scene.add.rectangle(baseData.x, baseData.y - 15, 50, 50, 0x000000, 0);
        // console.log(`🎯 Setting up click area for base ${baseIndex} at (${baseData.x}, ${baseData.y})`);
        // try {
        //     clickArea.setInteractive();
        //     clickArea.baseIndex = baseIndex;
        //     console.log(`✅ Base ${baseIndex} click area set up successfully`);
        // } catch (error) {
        //     console.error(`❌ Error setting up base ${baseIndex} interactivity:`, error);
        // }
        
        // Temporary: Create a simple non-interactive placeholder
        const clickArea = { baseIndex: baseIndex, setActive: () => {}, setVisible: () => {} };
        
        // TEMPORARILY DISABLED: Add hover effects
        // clickArea.on('pointerover', () => {
        //     highlight.setAlpha(1.0);
        //     highlight.clear();
        //     highlight.lineStyle(4, 0x66ff66, 1.0); // Brighter green on hover
        //     highlight.strokeCircle(0, 0, 30); // Slightly larger
        // });
        
        // clickArea.on('pointerout', () => {
        //     highlight.setAlpha(0.7);
        //     highlight.clear();
        //     highlight.lineStyle(4, 0x00ff00, 0.8);
        //     highlight.strokeCircle(0, 0, 25);
        // });
        
        // TEMPORARILY DISABLED: Handle base selection
        // clickArea.on('pointerdown', () => {
        //     console.log(`🎯 Player selected base ${baseIndex} at (${baseData.x}, ${baseData.y})`);
        //     
        //     if (setupPanel.currentPlayerData) {
        //         // Update player data with selected base
        //         setupPanel.currentPlayerData.baseIndex = baseIndex;
        //         
        //         // Update player name from input if provided
        //         const enteredName = setupPanel.currentNameText || '';
        //         if (enteredName.trim().length === 0) {
        //             setupPanel.currentPlayerData.name = `Player ${setupPanel.currentPlayerIndex + 1}`;
        //         } else {
        //             setupPanel.currentPlayerData.name = enteredName.trim();
        //         }
        //         
        //         // Update status
        //         setupPanel.statusText.setText(`Selected base at (${baseData.x}, ${baseData.y}) - Auto-continuing...`);
        //         
        //         // Complete this player's setup automatically after base selection
        //         if (setupPanel.onPlayerComplete) {
        //             // Add a small delay for user feedback
        //             setTimeout(() => {
        //                 setupPanel.onPlayerComplete(setupPanel.currentPlayerData);
        //             }, 500);
        //         }
        //     }
        // });
        
        baseHighlights.push(highlight);
        baseClickAreas.push(clickArea);
    });
    
    return {
        highlights: baseHighlights,
        clickAreas: baseClickAreas,
        
        // Update available bases (remove selected ones)
        updateAvailableBases: function(newAvailableBases) {
            console.log(`🔄 Updating available bases: ${newAvailableBases.length} remaining`);
            
            // Hide all current highlights and click areas
            this.highlights.forEach(h => h.setVisible(false));
            this.clickAreas.forEach(c => c.setActive(false));
            
            // Show only highlights for available bases
            this.highlights.forEach((highlight, index) => {
                const clickArea = this.clickAreas[index];
                const baseIndex = clickArea.baseIndex;
                
                if (newAvailableBases.includes(baseIndex)) {
                    highlight.setVisible(true);
                    clickArea.setActive(true);
                } else {
                    highlight.setVisible(false);
                    clickArea.setActive(false);
                }
            });
        },
        
        // Hide all base highlights
        hideAll: function() {
            this.highlights.forEach(h => h.setVisible(false));
            this.clickAreas.forEach(c => c.setActive(false));
        },
        
        // Show all available base highlights
        showAvailable: function(availableBases) {
            this.updateAvailableBases(availableBases);
        }
    };
}

/**
 * Set up keyboard input for name typing
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} panel - The panel object
 * @param {Phaser.GameObjects.Text} nameInputText - The text display object
 * @param {Phaser.GameObjects.Text} cursor - The cursor object
 */
function setupKeyboardInput(scene, panel, nameInputText, cursor) {
    // Create a more specific keyboard listener that doesn't interfere with other controls
    const keyboardHandler = (event) => {
        // Only handle input when panel is visible and has focus
        if (!panel.visible || !panel.currentPlayerData) return;
        
        const key = event.key;
        const currentText = panel.currentNameText || '';
        
        // Prevent default behavior for keys we handle to avoid conflicts
        if (key === 'Backspace' || key === 'Enter' || (key.length === 1 && key.match(/[a-zA-Z0-9\s]/))) {
            event.preventDefault();
        }
        
        if (key === 'Backspace') {
            // Remove last character
            if (currentText.length > 0) {
                panel.currentNameText = currentText.slice(0, -1);
                updateNameDisplay(panel, nameInputText, cursor);
            }
        } else if (key === 'Enter') {
            // Trigger ready button
            if (panel.onPlayerComplete && panel.currentPlayerData) {
                const enteredName = panel.currentNameText || '';
                if (enteredName.trim().length === 0) {
                    panel.currentPlayerData.name = `Player ${panel.currentPlayerIndex + 1}`;
                } else {
                    panel.currentPlayerData.name = enteredName.trim();
                }
                panel.onPlayerComplete(panel.currentPlayerData);
            }
        } else if (key.length === 1 && currentText.length < 10) {
            // Add character if it's printable and under limit
            if (key.match(/[a-zA-Z0-9\s]/)) {
                panel.currentNameText = currentText + key;
                updateNameDisplay(panel, nameInputText, cursor);
            }
        }
    };
    
    // Store the handler so we can remove it later
    panel.keyboardHandler = keyboardHandler;
    
    // Use scene's input keyboard manager instead of global events
    scene.input.keyboard.on('keydown', keyboardHandler);
}

/**
 * Update the name display text and cursor position
 * @param {Object} panel - The panel object
 * @param {Phaser.GameObjects.Text} nameInputText - The text display object
 * @param {Phaser.GameObjects.Text} cursor - The cursor object
 */
function updateNameDisplay(panel, nameInputText, cursor) {
    const text = panel.currentNameText || '';
    nameInputText.setText(text);
    
    // Position cursor after the text
    const textWidth = nameInputText.getBounds().width;
    cursor.setPosition(145 + textWidth, 74);
}

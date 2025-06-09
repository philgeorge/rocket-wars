// ui.js
// Game UI components for Rocket Wars

/**
 * Create a floating status panel showing game settings and player stats
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} gameState - Game state object containing wind, gravity, and player data
 * @returns {Phaser.GameObjects.Container & {updateDisplay: Function}}
 */
export function createStatusPanel(scene, gameState) {
    // Create main container positioned at top-right of screen
    const statusPanel = /** @type {Phaser.GameObjects.Container & {updateDisplay: Function}} */ (scene.add.container(0, 0));
    
    // Create background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.lineStyle(2, 0xffffff, 0.6);
    bg.fillRoundedRect(0, 0, 200, 180, 8);
    bg.strokeRoundedRect(0, 0, 200, 180, 8);
    
    // Title
    const title = scene.add.text(100, 15, 'GAME STATUS', {
        fontSize: '16px',
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center'
    }).setOrigin(0.5, 0.5);
    
    // Environment section
    const envTitle = scene.add.text(10, 35, 'ENVIRONMENT', {
        fontSize: '15px',
        fill: '#00ff00',
        fontWeight: 'bold'
    });
    
    const windText = scene.add.text(10, 50, '', {
        fontSize: '14px',
        fill: '#ffffff'
    });
    
    const gravityText = scene.add.text(10, 65, '', {
        fontSize: '14px',
        fill: '#ffffff'
    });
    
    // Player 1 section
    const player1Title = scene.add.text(10, 85, 'PLAYER 1 (BLUE)', {
        fontSize: '15px',
        fill: '#4a90e2',
        fontWeight: 'bold'
    });
    
    const player1Health = scene.add.text(10, 100, '', {
        fontSize: '14px',
        fill: '#ffffff'
    });
    
    const player1Stats = scene.add.text(10, 115, '', {
        fontSize: '14px',
        fill: '#ffffff'
    });
    
    // Player 2 section
    const player2Title = scene.add.text(10, 135, 'PLAYER 2 (YELLOW)', {
        fontSize: '15px',
        fill: '#f1c40f',
        fontWeight: 'bold'
    });
    
    const player2Health = scene.add.text(10, 150, '', {
        fontSize: '14px',
        fill: '#ffffff'
    });
    
    const player2Stats = scene.add.text(10, 165, '', {
        fontSize: '14px',
        fill: '#ffffff'
    });
    
    // Add all elements to container
    statusPanel.add([
        bg, title, envTitle, windText, gravityText,
        player1Title, player1Health, player1Stats,
        player2Title, player2Health, player2Stats
    ]);
    
    // Store text references for updates
    statusPanel.windText = windText;
    statusPanel.gravityText = gravityText;
    statusPanel.player1Health = player1Health;
    statusPanel.player1Stats = player1Stats;
    statusPanel.player2Health = player2Health;
    statusPanel.player2Stats = player2Stats;
    
    // Method to update the display with current game state
    statusPanel.updateDisplay = function(gameState) {
        // Update wind display with direction indicator
        const windDirection = gameState.wind.current >= 0 ? '→' : '←';
        const windSpeed = Math.abs(gameState.wind.current);
        this.windText.setText(`Wind: ${windDirection} ${windSpeed} (±${gameState.wind.variation}%)`);
        
        // Update gravity display
        this.gravityText.setText(`Gravity: ${gameState.gravity}`);
        
        // Update Player 1 stats
        this.player1Health.setText(`Health: ${gameState.player1.health}%`);
        this.player1Stats.setText(`Kills: ${gameState.player1.kills} Deaths: ${gameState.player1.deaths}`);
        
        // Update Player 2 stats
        this.player2Health.setText(`Health: ${gameState.player2.health}%`);
        this.player2Stats.setText(`Kills: ${gameState.player2.kills} Deaths: ${gameState.player2.deaths}`);
    };
    
    // Position panel at top-right of screen (will be updated in scene)
    statusPanel.setScrollFactor(0); // Keep panel fixed on screen regardless of camera movement
    
    return statusPanel;
}

/**
 * Initialize default game state object
 * @returns {Object} Default game state with wind, gravity, and player data
 */
export function createGameState() {
    const windVariation = 50; // Initial wind variation percentage
    const maxWind = (windVariation / 100) * 100; // Calculate max wind for initial value
    const initialWind = Math.floor(Math.random() * (2 * maxWind + 1)) - maxWind; // Random initial wind
    
    return {
        wind: {
            current: initialWind, // Current wind (-100 to +100, negative = left, positive = right)
            variation: windVariation // Wind variation percentage (0-100%), controls how much wind can change
        },
        gravity: 75, // Default gravity setting
        player1: {
            health: 100,
            kills: 0,
            deaths: 0
        },
        player2: {
            health: 100,
            kills: 0,
            deaths: 0
        }
    };
}

/**
 * Update wind value for new turn (varies within variation range)
 * @param {Object} gameState - Game state object
 */
export function updateWindForNewTurn(gameState) {
    // Calculate max wind based on variation percentage
    const maxWind = (gameState.wind.variation / 100) * 100; // Scale 0-100% to 0-100 wind units
    
    // Generate random wind from -maxWind to +maxWind
    gameState.wind.current = Math.floor(Math.random() * (2 * maxWind + 1)) - maxWind;
}

/**
 * Apply damage to a player's health
 * @param {Object} gameState - Game state object
 * @param {string} playerKey - 'player1' or 'player2'
 * @param {number} damage - Damage amount (0-100)
 */
export function applyDamage(gameState, playerKey, damage) {
    gameState[playerKey].health = Math.max(0, gameState[playerKey].health - damage);
    
    // Check if player died
    if (gameState[playerKey].health <= 0) {
        gameState[playerKey].deaths++;
        
        // Award kill to other player
        const otherPlayer = playerKey === 'player1' ? 'player2' : 'player1';
        gameState[otherPlayer].kills++;
    }
}

/**
 * Position status panel relative to camera view
 * @param {Phaser.GameObjects.Container} statusPanel - The status panel container
 * @param {Phaser.Cameras.Scene2D.Camera} camera - The main camera
 */
export function positionStatusPanel(statusPanel, camera) {
    // Position at top-right of camera view with some padding
    statusPanel.x = camera.scrollX + camera.width - 220; // 220 = panel width + padding
    statusPanel.y = camera.scrollY + 20; // 20px from top
}

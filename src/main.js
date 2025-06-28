// main.js
// Entry point for Rocket Wars game logic

import { setupWorldLandscape } from './landscape.js';
import { placeTurretsOnBases } from './turret.js';
import { createProjectile } from './projectile.js';
import { createEnvironmentPanel, createPlayerStatsPanel, positionEnvironmentPanel, positionPlayerStatsPanel } from './ui/index.js';
import { createGameState, updateWindForNewTurn, startPlayerTurn, getCurrentPlayer, advanceToNextPlayer, advanceToNextRound, shouldGameEnd, getRemainingTurnTime, stopTurnTimer } from './turnManager.js';
import { focusCameraOnActivePlayer } from './projectileManager.js';
import { initializeGameSetup } from './gameSetup.js';
import { initializeBaseSelection } from './baseSelection.js';
import { WORLD_HEIGHT, calculateWorldWidth } from './constants.js';
import { setupCameraAndInput, updateKeyboardCamera, setupWorldBounds } from './camera.js';
import { updateProjectiles } from './projectileManager.js';

// Game configuration and world dimensions will be set from form
let gameConfig = null;
let WORLD_WIDTH = 3000; // Default value, will be recalculated

// Initialize game setup and wait for form submission
initializeGameSetup().then((config) => {
    gameConfig = config;
    // Calculate world width based on number of players: 1000 + (numPlayers * 1000)
    WORLD_WIDTH = calculateWorldWidth(gameConfig.numPlayers);
    console.log(`World width calculated: ${WORLD_WIDTH} pixels for ${gameConfig.numPlayers} players`);
    console.log(`Gravity set to: ${gameConfig.gravity} (effective: ${gameConfig.gravity * 5} pixels/sec²)`);
    startGame();
});

/**
 * Start the Phaser game with the configured parameters
 */
function startGame() {
    // Debug viewport information for mobile troubleshooting
    console.log('📱 Viewport Debug Info:');
    console.log(`  window.innerWidth: ${window.innerWidth}`);
    console.log(`  window.innerHeight: ${window.innerHeight}`);
    console.log(`  window.outerWidth: ${window.outerWidth}`);
    console.log(`  window.outerHeight: ${window.outerHeight}`);
    console.log(`  screen.width: ${screen.width}`);
    console.log(`  screen.height: ${screen.height}`);
    console.log(`  devicePixelRatio: ${devicePixelRatio}`);
    console.log(`  User Agent: ${navigator.userAgent}`);
    
    // Create Phaser game config with form parameters
    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight, // Use full viewport height
        backgroundColor: '#222',
        parent: 'game-container',
        scene: {
            preload: preload,
            create: create,
            update: update
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: gameConfig.gravity * 5 }, // Scale gravity (20-100 -> 100-500)
                debug: false
            }
        },
        scale: {
            mode: Phaser.Scale.NONE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        input: {
            touch: {
                // Enable multi-touch gestures
                capture: true
            }
        }
    };

    // Start the game
    const game = new Phaser.Game(config);
}

function preload() {
    // Create a simple 1x1 white pixel texture for particles
    this.add.graphics()
        .fillStyle(0xffffff)
        .fillRect(0, 0, 1, 1)
        .generateTexture('pixel', 1, 1);
}

/**
 * Handle shooting logic when a turret fires
 * @param {Phaser.Scene & {projectiles?: any[], gameState?: any, environmentPanel?: any, playerStatsPanel?: any}} scene - The Phaser scene
 * @param {any} turret - The turret that is firing
 * @param {Object} shootData - The shooting data (angle, power, etc.)
 */
function shootFromTurret(scene, turret, shootData) {
    // Check if this player is allowed to shoot
    if (scene.gameState && scene.gameState.playersAlive) {
        const currentPlayerNum = getCurrentPlayer(scene.gameState);
        const currentPlayerKey = `player${currentPlayerNum}`;
        
        // Verify this is the active player's turret
        if (turret.team !== currentPlayerKey) {
            console.log(`🚫 Shooting blocked: ${turret.team} tried to shoot but it's Player ${currentPlayerNum}'s turn`);
            return;
        }
        
        // Check if player has already fired this turn
        if (scene.gameState.hasPlayerFiredThisTurn) {
            console.log(`🚫 Shooting blocked: Player ${currentPlayerNum} has already fired this turn`);
            return;
        }
        
        // Mark that this player has fired this turn and stop the turn timer
        scene.gameState.hasPlayerFiredThisTurn = true;
        stopTurnTimer(scene.gameState);
        console.log(`✅ Player ${currentPlayerNum} fired their shot this turn - timer stopped`);
    }
    
    // Launch projectile from turret gun tip
    const tipPosition = turret.getGunTipPosition();
    const projectile = createProjectile(scene, tipPosition.x, tipPosition.y, shootData.angle, shootData.power);

    // Store reference to firing turret for tooltip management
    projectile.firingTurret = turret;

    // Add projectile to scene's projectile list for tracking
    if (!scene.projectiles) {
        scene.projectiles = [];
    }
    scene.projectiles.push(projectile);

    console.log(`Projectile launched from (${Math.round(tipPosition.x)}, ${Math.round(tipPosition.y)})`);

}

/**
 * Create the game scene
 * @this {Phaser.Scene & {turrets: any[], currentPlayerTurret: any, projectiles: any[], landscapeData: any, gameState: any, environmentPanel: any, playerStatsPanel: any, cameraControls: any}}
 */
function create() {
    // Set up world bounds (camera and physics)
    setupWorldBounds(this, WORLD_WIDTH, WORLD_HEIGHT);

    // Handle browser resize to show more/less of the world
    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight; // Use full viewport height

            // Resize the game renderer
            this.scale.resize(newWidth, newHeight);

            // Update camera viewport size to show more/less of the world
            this.cameras.main.setSize(newWidth, newHeight);

            // Reposition panels to stay at fixed screen locations
            if (this.environmentPanel) {
                positionEnvironmentPanel(this.environmentPanel, newWidth, newHeight);
            }
            if (this.playerStatsPanel) {
                positionPlayerStatsPanel(this.playerStatsPanel, newWidth, newHeight);
            }
        }, 100); // Throttle resize events
    };

    // Initial resize to fit container
    handleResize();

    // Listen for window resize events
    window.addEventListener('resize', handleResize);

    // Set up world landscape (generation, drawing, and boundaries)
    const { landscapeData } = setupWorldLandscape(this, WORLD_WIDTH, WORLD_HEIGHT, gameConfig);

    // Store landscape data for collision detection
    this.landscapeData = landscapeData;

    // Initialize basic scene properties that will be needed
    this.projectiles = [];

    // 🆕 Set up camera controls and input BEFORE player setup so scrolling works during setup
    this.cameraControls = setupCameraAndInput(this, (turret, shootData) => {
        shootFromTurret(this, turret, shootData);
    });

    // 🆕 NEW: Start base selection stage instead of immediately placing turrets
    console.log('🎮 Starting base selection stage...');
    initializeBaseSelection(this, gameConfig, landscapeData.flatBases).then((setupResult) => {
        console.log('✅ Base selection complete, starting combat phase...');

        const { players: playerData, turrets: existingTurrets } = setupResult;

        // Use existing turrets if they were created during setup, otherwise create them
        let turrets;
        if (existingTurrets && existingTurrets.length > 0) {
            console.log(`🏭 Using ${existingTurrets.length} turrets created during setup`);
            turrets = existingTurrets;
        } else {
            console.log('🏭 Creating turrets from player data...');
            turrets = placeTurretsOnBases(this, landscapeData.flatBases, landscapeData.points, playerData);
        }

        const turretAny = /** @type {any} */ (turrets);
        console.log(`Using ${turrets.length} turrets:`, turretAny.map(t => ({ team: t.team, x: t.x, y: t.y })));

        // Log turret distances for AOE debugging
        if (turrets.length >= 2) {
            for (let i = 0; i < turrets.length; i++) {
                for (let j = i + 1; j < turrets.length; j++) {
                    const distance = Phaser.Math.Distance.Between(turrets[i].x, turrets[i].y, turrets[j].x, turrets[j].y);
                    console.log(`📏 Distance between ${turrets[i].team} and ${turrets[j].team}: ${distance.toFixed(1)}px`);
                }
            }
        }

        // Store turrets for access in input handlers
        this.turrets = turrets;
        this.currentPlayerTurret = null;

        // Store player data on scene for game-wide access
        /** @type {any} */ (this).playerData = playerData;

        // Initialize game state and UI (moved here to happen after player setup)
        this.gameState = createGameState(gameConfig);
        console.log('🎮 Game state initialized:', this.gameState);
        this.environmentPanel = createEnvironmentPanel(this, this.gameState);
        this.playerStatsPanel = createPlayerStatsPanel(this, this.gameState, playerData);

        // Position panels at fixed screen locations
        positionEnvironmentPanel(this.environmentPanel, this.cameras.main.width, this.cameras.main.height);
        positionPlayerStatsPanel(this.playerStatsPanel, this.cameras.main.width, this.cameras.main.height);

        // Initialize panel displays
        this.environmentPanel.updateDisplay(this.gameState);
        this.playerStatsPanel.updateDisplay(this.gameState);

        // Create timeout handler for turn time limits
        const handleTurnTimeout = () => {
            console.log(`⏰ Time's up! Advancing from Player ${getCurrentPlayer(this.gameState)}`);
            
            // Advance to next player/round
            const continueRound = advanceToNextPlayer(this.gameState);
            if (!continueRound) {
                // Round completed, advance to next round
                const continueGame = advanceToNextRound(this.gameState);
                if (!continueGame) {
                    console.log('🏁 Game Over! Max rounds reached');
                    // TODO: Handle game end
                    return;
                }
                // Update wind for new round
                updateWindForNewTurn(this.gameState);
            }
            
            // Check if game should end (only one player left)
            if (shouldGameEnd(this.gameState)) {
                console.log('🏁 Game Over! Only one player remaining');
                // TODO: Handle game end
                return;
            }
            
            // Update UI for new turn
            this.environmentPanel.updateDisplay(this.gameState);
            this.playerStatsPanel.updateDisplay(this.gameState);
            
            // Focus camera on new active player and start their turn
            focusCameraOnActivePlayer(this.gameState, this);
            startPlayerTurn(this.gameState, handleTurnTimeout);
        };

        // Store timeout handler on scene for access by projectileManager
        /** @type {any} */ (this).handleTurnTimeout = handleTurnTimeout;

        // Start the first player's turn with timeout handler
        startPlayerTurn(this.gameState, handleTurnTimeout);

        // Camera controls already set up before player setup

        // Start camera focused on the active player's turret with smooth pan
        if (turrets.length > 0) {
            // Add a small delay to ensure everything is initialized, then focus on first player
            this.time.delayedCall(500, () => {
                focusCameraOnActivePlayer(this.gameState, this);
            });
        }

        console.log('🚀 Combat phase ready!');
        console.log(`Game started: Player ${this.gameState.playersAlive[0]} begins Round 1`);
    }).catch((error) => {
        console.error('❌ Player setup failed:', error);
    });
}

/**
 * Update the game scene
 * @this {Phaser.Scene & {turrets: any[], currentPlayerTurret: any, projectiles: any[], landscapeData: any, gameState: any, environmentPanel: any, playerStatsPanel: any, cameraControls: any}}
 */
function update() {
    // Update projectiles (now handled by projectile manager)
    if (this.projectiles) {
        updateProjectiles(this, this.projectiles, this.gameState, 
                         this.landscapeData, this.turrets, this.cameraControls);
    }
    
    // Update UI timer display
    if (this.environmentPanel && this.gameState) {
        this.environmentPanel.updateDisplay(this.gameState);
    }
    
    // Handle keyboard camera movement
    updateKeyboardCamera(this);
}

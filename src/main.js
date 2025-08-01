// main.js
// Entry point for Rocket Wars game logic

import { setupWorldLandscape } from './landscape.js';
import { placeTurretsOnBases } from './turret.js';
import { createProjectile } from './projectile.js';
import { createEnvironmentPanel, createPlayerStatsPanel, positionEnvironmentPanel, positionPlayerStatsPanel, createAimingInstructionsPanel, hideAimingInstructionsPanel, showAimingInstructionsIfNeeded, positionPanel } from './ui/index.js';
import { createGameState, updateWindForNewTurn, startPlayerTurn, getCurrentPlayer, advanceToNextPlayer, advanceToNextRound, shouldGameEnd, getRemainingTurnTime, stopTurnTimer, getRankedPlayers, enterTeleportMode, exitTeleportMode, completeTeleport, isTeleportMode } from './turnManager.js';
import { focusCameraOnActivePlayer } from './projectileManager.js';
import { initializeGameSetup } from './gameSetup.js';
import { initializeBaseSelection } from './baseSelection.js';
import { WORLD_HEIGHT, calculateWorldWidth } from './constants.js';
import { setupCameraAndInput, updateKeyboardCamera, setupWorldBounds } from './camera.js';
import { updateProjectiles } from './projectileManager.js';
import { logDeviceInfo } from './deviceDetection.js';
import { handleGameEnd } from './gameLifecycle.js';

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
    // Log device detection info for debugging and optimization
    logDeviceInfo();
    
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

/**
 * Preload assets for the game
 * @this {Phaser.Scene}
 */
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

    // Update teleport button since projectiles are now in flight
    scene.environmentPanel?.updateTeleportButton?.(scene.gameState, scene);

}

/**
 * Create the game scene
 * @this {Phaser.Scene & {turrets: any[], currentPlayerTurret: any, projectiles: any[], landscapeData: any, landscapeGraphics: any, gameState: any, environmentPanel: any, playerStatsPanel: any, aimingInstructionsPanel: any, cameraControls: any}}
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
            if (this.aimingInstructionsPanel) {
                // Re-center the aiming instructions panel using the utility function
                positionPanel(this.aimingInstructionsPanel, 'center', newWidth, newHeight);
            }
        }, 100); // Throttle resize events
    };

    // Initial resize to fit container
    handleResize();

    // Listen for window resize events
    window.addEventListener('resize', handleResize);

    // Set up world landscape (generation, drawing, and boundaries)
    // TEMP: Enable chunked terrain system for testing destructible landscape
    const useChunkedTerrain = true; // Set to false to use original point-based terrain
    const { landscapeData, graphics } = setupWorldLandscape(this, WORLD_WIDTH, WORLD_HEIGHT, gameConfig, useChunkedTerrain);

    // Store landscape data for collision detection
    this.landscapeData = landscapeData;
    this.landscapeGraphics = graphics;

    this.projectiles = [];

    // Set up camera controls and input BEFORE player setup so scrolling works during setup
    this.cameraControls = setupCameraAndInput(this, (turret, shootData) => {
        shootFromTurret(this, turret, shootData);
    });

    // Start base selection stage instead of immediately placing turrets
    console.log('🎮 Starting base selection stage...');
    initializeBaseSelection(this, gameConfig, landscapeData.flatBases).then((setupResult) => {
        console.log('✅ Base selection complete, starting combat phase...');

        const { players: playerData, turrets: existingTurrets } = setupResult;

        // Use existing turrets if they were created during setup, otherwise create them
        let turrets;
        if (existingTurrets && existingTurrets.length > 0) {
            turrets = existingTurrets;
        } else {
            turrets = placeTurretsOnBases(this, landscapeData.flatBases, landscapeData.points, playerData);
        }

        const turretAny = /** @type {any} */ (turrets);
        console.log(`Using ${turrets.length} turrets:`, turretAny.map(t => ({ team: t.team, x: t.x, y: t.y })));

        // Store turrets for access in input handlers
        this.turrets = turrets;
        this.currentPlayerTurret = null;

        // Store player data on scene for game-wide access
        /** @type {any} */ (this).playerData = playerData;

        // Initialize game state and UI (moved here to happen after player setup)
        this.gameState = createGameState(gameConfig);
        console.log('🎮 Game state initialized:', this.gameState);
        
        // Sync base indices from player data to game state
        playerData.forEach((player, index) => {
            if (player.baseIndex !== null && player.baseIndex !== undefined) {
                const playerNum = index + 1;
                const playerKey = `player${playerNum}`;
                if (this.gameState[playerKey]) {
                    this.gameState[playerKey].baseIndex = player.baseIndex;
                    console.log(`📍 Player ${playerNum} base index synced: ${player.baseIndex}`);
                }
            }
        });
        
        // Add teleport management functions to scene for easy access
        /** @type {any} */ (this).enterTeleportMode = () => enterTeleportMode(this.gameState, this);
        /** @type {any} */ (this).exitTeleportMode = () => exitTeleportMode(this.gameState, this);
        /** @type {any} */ (this).completeTeleport = () => completeTeleport(this.gameState, this);
        /** @type {any} */ (this).isTeleportMode = () => isTeleportMode(this.gameState);
        
        this.environmentPanel = createEnvironmentPanel(this, this.gameState);
        this.playerStatsPanel = createPlayerStatsPanel(this, this.gameState, playerData);

        // Create aiming instructions panel (initially hidden)
        this.aimingInstructionsPanel = createAimingInstructionsPanel(this);
        this.aimingInstructionsPanel.setVisible(false);

        // Position panels at fixed screen locations
        positionEnvironmentPanel(this.environmentPanel, this.cameras.main.width, this.cameras.main.height);
        positionPlayerStatsPanel(this.playerStatsPanel, this.cameras.main.width, this.cameras.main.height);

        // Initialize panel displays
        this.environmentPanel.updateDisplay(this.gameState);
        this.environmentPanel.updateTeleportButton(this.gameState, this);
        this.playerStatsPanel.updateDisplay(this.gameState);

        // Create timeout handler for turn time limits
        const handleTurnTimeout = () => {
            console.log(`⏰ Time's up! Advancing from Player ${getCurrentPlayer(this.gameState)}`);
            
            // Advance to next player/round
            const continueRound = advanceToNextPlayer(this.gameState, this);
            if (!continueRound) {
                // Round completed, advance to next round
                const continueGame = advanceToNextRound(this.gameState);
                if (!continueGame) {
                    handleGameEnd(this, 'max_rounds');
                    return;
                }
                // Update wind for new round
                updateWindForNewTurn(this.gameState);
            }
            
            // Check if game should end (only one player left)
            if (shouldGameEnd(this.gameState)) {
                handleGameEnd(this, 'last_player');
                return;
            }
            
            // Update UI for new turn
            this.environmentPanel.updateDisplay(this.gameState);
            this.environmentPanel.updateTeleportButton(this.gameState, this);
            this.playerStatsPanel.updateDisplay(this.gameState);
            
            // Focus camera on new active player and start their turn
            focusCameraOnActivePlayer(this.gameState, this);
            
            // Start turn timer immediately for subsequent turns (instructions only show once)
            startPlayerTurn(this.gameState, handleTurnTimeout);
        };

        // Store timeout handler on scene for access by projectileManager
        /** @type {any} */ (this).handleTurnTimeout = handleTurnTimeout;

        // Helper function to start a turn with conditional timer delay
        const startTurnWithInstructions = () => {
            // Check if aiming instructions need to be shown
            const instructionsShown = showAimingInstructionsIfNeeded(this, () => {
                // Callback when instructions are dismissed - start the turn timer
                startPlayerTurn(this.gameState, handleTurnTimeout);
                console.log('🎯 Turn timer started after aiming instructions dismissed');
            });
            
            if (!instructionsShown) {
                // Instructions not shown, start turn timer immediately
                startPlayerTurn(this.gameState, handleTurnTimeout);
            }
        };

        // Start the first player's turn (with conditional timer delay for instructions)
        startTurnWithInstructions();

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
 * @this {Phaser.Scene & {turrets: any[], currentPlayerTurret: any, projectiles: any[], landscapeData: any, landscapeGraphics: any, gameState: any, environmentPanel: any, playerStatsPanel: any, cameraControls: any, resultsPanel?: any, gameEnded?: boolean}}
 */
function update() {
    // Update projectiles (now handled by projectile manager)
    if (this.projectiles) {
        updateProjectiles(this, this.projectiles, this.gameState, 
                         this.landscapeData, this.turrets, this.cameraControls);
    }
    
    // Only update timer if it's active
    if (this.environmentPanel && this.gameState) {
        const hasActiveTimer = this.gameState.turnTimeLimit > 0 && this.gameState.turnStartTime;
        if (hasActiveTimer) {
            this.environmentPanel.updateTimer(this.gameState);
        }
    }
    
    // Handle keyboard camera movement
    updateKeyboardCamera(this);
}

// main.js
// Entry point for Rocket Wars game logic

import { setupChunkedLandscape } from './chunkedLandscape.js';
import { placeTurretsOnChunks } from './turret.js';
import { createProjectile } from './projectile.js';
import { createEnvironmentPanel, createPlayerStatsPanel, positionEnvironmentPanel, positionPlayerStatsPanel, createAimingInstructionsPanel, showAimingInstructionsIfNeeded, positionPanel } from './ui/index.js';
import { createGameState, startPlayerTurn, getCurrentPlayer, stopTurnTimer, enterTeleportMode, exitTeleportMode, completeTeleport, isTeleportMode } from './turnManager.js';
import { progressTurn } from './turnFlow.js';
import { updateGameUI } from './ui/updateUI.js';
import { focusCameraOnActivePlayer } from './projectileManager.js';
import { initializeGameSetup } from './gameSetup.js';
import { initializeBaseSelection } from './baseSelection.js';
import { WORLD_HEIGHT, calculateWorldWidth } from './constants.js';
import { setupCameraAndInput, updateKeyboardCamera, setupWorldBounds } from './camera.js';
import { updateProjectiles } from './projectileManager.js';
import { logDeviceInfo } from './deviceDetection.js';
import { info, trace, warn, error } from './logger.js';

// Game configuration and world dimensions will be set from form
let gameConfig = null;
let WORLD_WIDTH = 3000; // Default value, will be recalculated

// Initialize game setup and wait for form submission
initializeGameSetup().then((config) => {
    gameConfig = config;
    // Calculate world width based on number of players: 1000 + (numPlayers * 1000)
    WORLD_WIDTH = calculateWorldWidth(gameConfig.numPlayers);
    info(`World width calculated: ${WORLD_WIDTH} pixels for ${gameConfig.numPlayers} players`);
    info(`Gravity set to: ${gameConfig.gravity} (effective: ${gameConfig.gravity * 5} pixels/sec²)`);
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
    const _game = new Phaser.Game(config);
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
            warn(`🚫 Shooting blocked: ${turret.team} tried to shoot but it's Player ${currentPlayerNum}'s turn`);
            return;
        }
        
        // Check if player has already fired this turn
        if (scene.gameState.hasPlayerFiredThisTurn) {
            warn(`🚫 Shooting blocked: Player ${currentPlayerNum} has already fired this turn`);
            return;
        }
        
        // Mark that this player has fired this turn and stop the turn timer
        scene.gameState.hasPlayerFiredThisTurn = true;
        stopTurnTimer(scene.gameState);
        info(`✅ Player ${currentPlayerNum} fired their shot this turn - timer stopped`);
    }
    
    // Launch projectile from turret gun tip
    const tipPosition = turret.getGunTipPosition();
    const projectile = createProjectile(scene, tipPosition.x, tipPosition.y, shootData.angle, shootData.power, turret.team);

    // Store reference to firing turret for tooltip management
    projectile.firingTurret = turret;

    // Add projectile to scene's projectile list for tracking
    if (!scene.projectiles) {
        scene.projectiles = [];
    }
    scene.projectiles.push(projectile);

    trace(`Projectile launched from (${Math.round(tipPosition.x)}, ${Math.round(tipPosition.y)})`);

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
    const { landscapeData, graphics } = setupChunkedLandscape(this, WORLD_WIDTH, WORLD_HEIGHT, gameConfig);

    // Store landscape data for collision detection
    this.landscapeData = landscapeData;
    this.landscapeGraphics = graphics;

    this.projectiles = [];

    // Set up camera controls and input BEFORE player setup so scrolling works during setup
    this.cameraControls = setupCameraAndInput(this, (turret, shootData) => {
        shootFromTurret(this, turret, shootData);
    });

    // Start base selection stage instead of immediately placing turrets
    info('🎮 Starting base selection stage...');
    initializeBaseSelection(this, gameConfig).then((setupResult) => {
        info('✅ Base selection complete, starting combat phase...');

        const { players: playerData, turrets: existingTurrets } = setupResult;

        // Use existing turrets if they were created during setup, otherwise create them
        let turrets;
        if (existingTurrets && existingTurrets.length > 0) {
            turrets = existingTurrets;
        } else {
            turrets = placeTurretsOnChunks(this, landscapeData.chunks || [], playerData);
        }

        const turretAny = /** @type {any} */ (turrets);
        info(`Using ${turrets.length} turrets:`, turretAny.map(t => ({ team: t.team, x: t.x, y: t.y })));

        // Store turrets for access in input handlers
        this.turrets = turrets;
        this.currentPlayerTurret = null;

        // Store player data on scene for game-wide access
        /** @type {any} */ (this).playerData = playerData;

        // Initialize game state and UI (moved here to happen after player setup)
        this.gameState = createGameState(gameConfig);
        info('🎮 Game state initialized:', this.gameState);
        
        // Sync base indices from player data to game state
        playerData.forEach((player, index) => {
            if (player.chunkIndex !== null && player.chunkIndex !== undefined) {
                const playerNum = index + 1;
                const playerKey = `player${playerNum}`;
                if (this.gameState[playerKey]) {
                    this.gameState[playerKey].chunkIndex = player.chunkIndex;
                    trace(`📍 Player ${playerNum} chunk index synced: ${player.chunkIndex}`);
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

        // Initialize panel displays (single centralized call)
        updateGameUI(this, this.gameState, { updateEnvironment: true, updatePlayers: true, updateTeleport: true });

        // Create timeout handler for turn time limits
        // Attach unified turn progression helper to scene
        /** @type {any} */ (this).progressTurn = (reason, opts) => progressTurn(this, reason, opts);

        // Helper function to start a turn with conditional timer delay
        const startTurnWithInstructions = () => {
            // Check if aiming instructions need to be shown
            const instructionsShown = showAimingInstructionsIfNeeded(this, () => {
                const sceneAny = /** @type {any} */ (this);
                startPlayerTurn(this.gameState, () => sceneAny.progressTurn('timeout'));
                info('🎯 Turn timer started after aiming instructions dismissed');
            });
            
            if (!instructionsShown) {
                const sceneAny = /** @type {any} */ (this);
                startPlayerTurn(this.gameState, () => sceneAny.progressTurn('timeout'));
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

        info('🚀 Combat phase ready!');
        info(`Game started: Player ${this.gameState.playersAlive[0]} begins Round 1`);
    }).catch((err) => {
        error('❌ Player setup failed:', err);
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

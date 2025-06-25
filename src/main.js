// main.js
// Entry point for Rocket Wars game logic

import { setupWorldLandscape } from './landscape.js';
import { placeTurretsOnBases } from './turret.js';
import { createProjectile } from './projectile.js';
import { createEnvironmentPanel, createPlayerStatsPanel, createGameState, updateWindForNewTurn, positionEnvironmentPanel, positionPlayerStatsPanel } from './ui.js';
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
    // Create Phaser game config with form parameters
    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight - 20, // Account for margin
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

    // Update wind for next turn and trigger panel updates
    if (scene.gameState) {
        updateWindForNewTurn(scene.gameState);
        // Update panel displays
        if (scene.environmentPanel && scene.environmentPanel.updateDisplay) {
            scene.environmentPanel.updateDisplay(scene.gameState);
        }
        if (scene.playerStatsPanel && scene.playerStatsPanel.updateDisplay) {
            scene.playerStatsPanel.updateDisplay(scene.gameState);
        }
    }
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
            const newHeight = window.innerHeight - 20; // Account for margin

            // Resize the game renderer
            this.scale.resize(newWidth, newHeight);

            // Update camera viewport size to show more/less of the world
            this.cameras.main.setSize(newWidth, newHeight);

            // Reposition panels to stay at fixed screen locations
            if (this.environmentPanel) {
                positionEnvironmentPanel(this.environmentPanel);
            }
            if (this.playerStatsPanel) {
                positionPlayerStatsPanel(this.playerStatsPanel, newWidth);
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
        this.environmentPanel = createEnvironmentPanel(this, this.gameState);
        this.playerStatsPanel = createPlayerStatsPanel(this, this.gameState, playerData);

        // Position panels at fixed screen locations
        positionEnvironmentPanel(this.environmentPanel);
        positionPlayerStatsPanel(this.playerStatsPanel, this.cameras.main.width);

        // Initialize panel displays
        this.environmentPanel.updateDisplay(this.gameState);
        this.playerStatsPanel.updateDisplay(this.gameState);

        // Camera controls already set up before player setup

        // Start camera focused on the left turret (player 1)
        if (turrets.length > 0) {
            this.cameras.main.centerOn(turrets[0].x, turrets[0].y);
        }

        console.log('🚀 Combat phase ready!');
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
    
    // Handle keyboard camera movement
    updateKeyboardCamera(this);
}

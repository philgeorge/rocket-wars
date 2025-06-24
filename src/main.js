// main.js
// Entry point for Rocket Wars game logic

import { generateLandscapePoints, drawLandscape, drawWorldBoundaries } from './landscape.js';
import { placeTurretsOnBases } from './turret.js';
import { createProjectile, updateProjectileTrail, drawProjectileTrail, createExplosion, checkProjectileCollisions, cleanupProjectile, calculateDamage, calculateAOEDamage, calculateVelocityFactor } from './projectile.js';
import { createEnvironmentPanel, createPlayerStatsPanel, createGameState, updateWindForNewTurn, applyDamage, positionEnvironmentPanel, positionPlayerStatsPanel } from './ui.js';
import { initializeGameSetup } from './gameSetup.js';
import { initializeBaseSelection } from './baseSelection.js';
import { WORLD_HEIGHT, calculateWorldWidth } from './constants.js';
import { setupCameraAndInput, updateProjectileCamera, updateKeyboardCamera } from './camera.js';

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
    // Set camera bounds to the world size
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    // Set physics world bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
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
    
    // Draw a simple 2D landscape using graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0x3a5c2c, 1); // greenish color for landscape
    // Generate and draw random landscape
    const baseY = WORLD_HEIGHT - 100;
    const numPoints = Math.floor(WORLD_WIDTH / 50); // Calculate points based on world width
    console.log(`Generating landscape with world width: ${WORLD_WIDTH}px, height: ${WORLD_HEIGHT}px, points: ${numPoints}`);
    const { points, flatBases } = generateLandscapePoints(WORLD_WIDTH, baseY, numPoints, gameConfig.numPlayers);
    drawLandscape(graphics, points, WORLD_WIDTH, WORLD_HEIGHT, flatBases);
    
    // Mark the world boundaries
    drawWorldBoundaries(graphics, WORLD_WIDTH, WORLD_HEIGHT);

    // Store landscape data for collision detection
    this.landscapeData = { points, flatBases };
    
    // Initialize basic scene properties that will be needed
    this.projectiles = [];
    
    // 🆕 Set up camera controls and input BEFORE player setup so scrolling works during setup
    this.cameraControls = setupCameraAndInput(this, (turret, shootData) => {
        shootFromTurret(this, turret, shootData);
    });
    
    // 🆕 NEW: Start base selection stage instead of immediately placing turrets
    console.log('🎮 Starting base selection stage...');
    initializeBaseSelection(this, gameConfig, flatBases).then((setupResult) => {
        console.log('✅ Base selection complete, starting combat phase...');
        
        const { players: playerData, turrets: existingTurrets } = setupResult;
        
        // Use existing turrets if they were created during setup, otherwise create them
        let turrets;
        if (existingTurrets && existingTurrets.length > 0) {
            console.log(`🏭 Using ${existingTurrets.length} turrets created during setup`);
            turrets = existingTurrets;
        } else {
            console.log('🏭 Creating turrets from player data...');
            turrets = placeTurretsOnBases(this, flatBases, points, playerData);
        }
        
        const turretAny = /** @type {any} */ (turrets);
        console.log(`Using ${turrets.length} turrets:`, turretAny.map(t => ({team: t.team, x: t.x, y: t.y})));
        
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
    // Camera controls are handled in setupCameraAndInput
    
    // Update projectiles
    if (this.projectiles) {
        // Camera follows projectiles with smooth following
        updateProjectileCamera(this, this.projectiles);
        
        // Update each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Apply continuous wind force to projectile during flight
            if (this.gameState && projectile.body) {
                const windForce = this.gameState.wind.current / 100; // Normalize to -1 to +1
                const windAcceleration = windForce * 220; // Wind acceleration (pixels/sec²)
                
                // Apply wind as horizontal acceleration (accumulated over time)
                projectile.body.acceleration.x = windAcceleration;
                
                // Optional: Add slight air resistance for more realistic physics
                const airResistance = 0.99; // Slight velocity reduction each frame
                projectile.body.velocity.x *= airResistance;
                projectile.body.velocity.y *= airResistance;
                
                // Debug: Log wind effect periodically (every 30 frames ≈ 0.5 seconds)
                if (Math.floor(this.time.now / 500) > Math.floor((this.time.now - 16) / 500)) {
                    console.log(`Wind effect: ${this.gameState.wind.current} units, acceleration: ${windAcceleration.toFixed(1)} px/s²`);
                }
            }
            
            // Update trail effect
            updateProjectileTrail(projectile);
            drawProjectileTrail(this, projectile);
            
            // Check for collisions
            const collisions = checkProjectileCollisions(this, projectile, this.landscapeData, this.turrets);
            
            // Check if projectile should be removed
            let shouldRemove = false;
            
            if (collisions.terrain) {
                console.log('Projectile hit terrain!');
                
                // Calculate velocity-based explosion size (includes visual scaling)
                const velocityFactor = calculateVelocityFactor(projectile);
                const baseExplosionSize = 75; // Minimum explosion size
                const maxExplosionSize = 150; // Maximum explosion size
                const terrainExplosionSize = baseExplosionSize + (maxExplosionSize - baseExplosionSize) * velocityFactor;
                
                console.log(`🌍 Terrain explosion: velocity factor ${(velocityFactor * 100).toFixed(1)}%, size: ${terrainExplosionSize.toFixed(1)}px`);
                createExplosion(this, projectile.x, projectile.y, terrainExplosionSize, 'terrain');
                
                // Check for AOE damage to nearby turrets
                const affectedTurrets = calculateAOEDamage(projectile.x, projectile.y, terrainExplosionSize, this.turrets);
                
                // Apply AOE damage to affected turrets
                affectedTurrets.forEach(({turret, damage}) => {
                    applyDamage(this.gameState, turret.team, damage);
                    // Update turret visual health indicator
                    if (turret.updateHealthDisplay) {
                        turret.updateHealthDisplay(this.gameState[turret.team].health);
                    }
                    console.log(`🌊 ${turret.team} turret took ${damage} AOE damage from terrain explosion, health now: ${this.gameState[turret.team].health}%`);
                });
                
                // Update panels if any turrets were damaged
                if (affectedTurrets.length > 0) {
                    if (this.environmentPanel && this.environmentPanel.updateDisplay) {
                        this.environmentPanel.updateDisplay(this.gameState);
                    }
                    if (this.playerStatsPanel && this.playerStatsPanel.updateDisplay) {
                        this.playerStatsPanel.updateDisplay(this.gameState);
                    }
                }
                
                shouldRemove = true;
            } else if (collisions.turret) {
                console.log(`Projectile hit ${collisions.turret.team} turret!`);
                
                // Calculate dynamic damage based on accuracy and velocity
                const damage = calculateDamage(projectile, collisions.turret, collisions.turretDistance || 0);
                
                // Calculate velocity-based explosion size
                const velocityFactor = calculateVelocityFactor(projectile);
                const baseExplosionSize = 90; // Minimum explosion size for turret hits
                const maxExplosionSize = 180; // Maximum explosion size for turret hits
                const explosionSize = baseExplosionSize + (maxExplosionSize - baseExplosionSize) * velocityFactor;
                
                console.log(`🎯 Turret explosion: velocity factor ${(velocityFactor * 100).toFixed(1)}%, size: ${explosionSize.toFixed(1)}px (damage: ${damage})`);
                createExplosion(this, projectile.x, projectile.y, explosionSize, 'turret');
                
                // Apply direct damage to hit turret
                applyDamage(this.gameState, collisions.turret.team, damage);
                // Update turret visual health indicator
                if (collisions.turret.updateHealthDisplay) {
                    collisions.turret.updateHealthDisplay(this.gameState[collisions.turret.team].health);
                }
                console.log(`💥 ${collisions.turret.team} turret took ${damage} direct damage, health now: ${this.gameState[collisions.turret.team].health}%`);
                
                // Check for AOE damage to other nearby turrets (excluding the directly hit one)
                const otherTurrets = this.turrets.filter(t => t !== collisions.turret);
                const affectedTurrets = calculateAOEDamage(projectile.x, projectile.y, explosionSize, otherTurrets);
                
                // Apply AOE damage to affected turrets
                affectedTurrets.forEach(({turret, damage: aoeDamage}) => {
                    applyDamage(this.gameState, turret.team, aoeDamage);
                    // Update turret visual health indicator
                    if (turret.updateHealthDisplay) {
                        turret.updateHealthDisplay(this.gameState[turret.team].health);
                    }
                    console.log(`🌊 ${turret.team} turret took ${aoeDamage} AOE damage from turret explosion, health now: ${this.gameState[turret.team].health}%`);
                });
                
                // Update panel displays
                if (this.environmentPanel && this.environmentPanel.updateDisplay) {
                    this.environmentPanel.updateDisplay(this.gameState);
                }
                if (this.playerStatsPanel && this.playerStatsPanel.updateDisplay) {
                    this.playerStatsPanel.updateDisplay(this.gameState);
                }
                
                shouldRemove = true;
            } else if (collisions.worldBounds) {
                console.log('Projectile left world bounds');
                shouldRemove = true;
            } else if (this.time.now - projectile.startTime > projectile.maxFlightTime) {
                console.log('Projectile timed out');
                shouldRemove = true;
            }
            
            // Remove projectile if needed
            if (shouldRemove) {
                // Trigger tooltip fade for the turret that fired this projectile
                if (projectile.firingTurret && projectile.firingTurret.aimTooltip && projectile.firingTurret.aimTooltip.visible) {
                    projectile.firingTurret.hideTooltip(500, 1500); // Shorter delay, faster fade
                }
                
                cleanupProjectile(projectile);
                this.projectiles.splice(i, 1);
                
                // When last projectile is removed, disable camera following
                if (this.projectiles.length === 1 && this.cameraControls && this.cameraControls.followingProjectile) {
                    console.log('Last projectile removed - re-enabling camera controls');
                    this.cameraControls.followingProjectile = false;
                }
            }
        }
        
        // Ensure camera following is disabled when no projectiles remain
        if (this.projectiles.length === 0 && this.cameraControls && this.cameraControls.followingProjectile) {
            console.log('No projectiles remaining - disabling camera following');
            this.cameraControls.followingProjectile = false;
        }
    }
    
    // Handle keyboard camera movement
    updateKeyboardCamera(this);
}

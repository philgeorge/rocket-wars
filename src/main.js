// main.js
// Entry point for Rocket Wars game logic

import { generateLandscapePoints, drawLandscape, drawWorldBoundaries } from './landscape.js';
import { placeTurretsOnBases } from './turret.js';
import { createProjectile, updateProjectileTrail, drawProjectileTrail, createExplosion, checkProjectileCollisions, cleanupProjectile, calculateDamage, calculateAOEDamage, calculateVelocityFactor } from './projectile.js';
import { createEnvironmentPanel, createPlayerStatsPanel, createGameState, updateWindForNewTurn, applyDamage, positionEnvironmentPanel, positionPlayerStatsPanel } from './ui.js';
import { initializeGameSetup } from './gameSetup.js';
import { WORLD_HEIGHT, calculateWorldWidth } from './constants.js';

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

    // Create and place gun turrets on the flat bases
    const turrets = placeTurretsOnBases(this, flatBases, points, gameConfig.numPlayers);
    console.log(`Created ${turrets.length} turrets:`, turrets.map(t => ({team: t.team, x: t.x, y: t.y})));
    
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
    
    // Store projectiles for physics updates
    this.projectiles = [];
    
    // Store landscape data for collision detection
    this.landscapeData = { points, flatBases };
    
    // Initialize game state and UI
    this.gameState = createGameState(gameConfig);
    this.environmentPanel = createEnvironmentPanel(this, this.gameState);
    this.playerStatsPanel = createPlayerStatsPanel(this, this.gameState);
    
    // Position panels at fixed screen locations
    positionEnvironmentPanel(this.environmentPanel);
    positionPlayerStatsPanel(this.playerStatsPanel, this.cameras.main.width);
    
    // Initialize panel displays
    this.environmentPanel.updateDisplay(this.gameState);
    this.playerStatsPanel.updateDisplay(this.gameState);
    
    // Set up camera controls and input
    setupCameraAndInput(this);

    // Start camera focused on the left turret (player 1)
    if (turrets.length > 0) {
        this.cameras.main.centerOn(turrets[0].x, turrets[0].y);
    }
}

/**
 * Update the game scene
 * @this {Phaser.Scene & {turrets: any[], currentPlayerTurret: any, projectiles: any[], landscapeData: any, gameState: any, environmentPanel: any, playerStatsPanel: any, cameraControls: any}}
 */
function update() {
    // Camera controls are handled in setupCameraAndInput
    
    // Update projectiles
    if (this.projectiles) {
        // Camera follows the projectile (smooth following for better mobile experience)
        if (this.projectiles.length > 0) {
            // Get the first (newest) projectile to follow
            const activeProjectile = this.projectiles[0];
            
            // Smooth camera following with lerp for cinematic effect
            const camera = this.cameras.main;
            const lerpFactor = 0.08; // Adjust for smoothness (0.05-0.15 works well)
            
            // Calculate target position (slightly ahead of projectile based on velocity direction)
            const body = activeProjectile.body;
            const leadDistance = 100; // How far ahead to look
            let targetX = activeProjectile.x;
            let targetY = activeProjectile.y;
            
            // Add leading prediction based on velocity
            if (body && body.velocity) {
                const velocityMagnitude = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);
                if (velocityMagnitude > 50) { // Only lead if moving fast enough
                    const normalizedVelX = body.velocity.x / velocityMagnitude;
                    const normalizedVelY = body.velocity.y / velocityMagnitude;
                    targetX += normalizedVelX * leadDistance;
                    targetY += normalizedVelY * leadDistance;
                }
            }
            
            // Smoothly move camera towards target
            const currentX = camera.scrollX + camera.width / 2;
            const currentY = camera.scrollY + camera.height / 2;
            const newX = currentX + (targetX - currentX) * lerpFactor;
            const newY = currentY + (targetY - currentY) * lerpFactor;
            
            camera.centerOn(newX, newY);
            
            // Enable following mode
            if (this.cameraControls) {
                this.cameraControls.followingProjectile = true;
            }
        }
        
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
                console.log(`💥 ${collisions.turret.team} turret took ${damage} direct damage, health now: ${this.gameState[collisions.turret.team].health}%`);
                
                // Check for AOE damage to other nearby turrets (excluding the directly hit one)
                const otherTurrets = this.turrets.filter(t => t !== collisions.turret);
                const affectedTurrets = calculateAOEDamage(projectile.x, projectile.y, explosionSize, otherTurrets);
                
                // Apply AOE damage to affected turrets
                affectedTurrets.forEach(({turret, damage: aoeDamage}) => {
                    applyDamage(this.gameState, turret.team, aoeDamage);
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
    
    // Keyboard camera movement (disabled while following projectile)
    if (this.cameraControls && !this.cameraControls.isDragging() && !this.cameraControls.isPanning() && !this.currentPlayerTurret && !this.cameraControls.followingProjectile) {
        const camera = this.cameras.main;
        const speed = 5;
        
        if (this.cameraControls.cursors.left.isDown || this.cameraControls.wasd.A.isDown) {
            camera.scrollX -= speed;
        }
        if (this.cameraControls.cursors.right.isDown || this.cameraControls.wasd.D.isDown) {
            camera.scrollX += speed;
        }
        if (this.cameraControls.cursors.up.isDown || this.cameraControls.wasd.W.isDown) {
            camera.scrollY -= speed;
        }
        if (this.cameraControls.cursors.down.isDown || this.cameraControls.wasd.S.isDown) {
            camera.scrollY += speed;
        }
    }
}

function setupCameraAndInput(scene) {
    // Camera drag controls
    let isDragging = false;
    let dragStartX, dragStartY;
    let cameraStartX, cameraStartY;
    
    // Multi-touch pan/scroll controls
    let isPanning = false;
    let panStartX, panStartY;
    let panCameraStartX, panCameraStartY;
    let activePointers = new Set(); // Track active touch points
    
    // Function to stop dragging (used by multiple events)
    const stopDragging = () => {
        isDragging = false;
    };
    
    // Function to stop panning (used by multi-touch events)
    const stopPanning = () => {
        isPanning = false;
        activePointers.clear();
    };
    
    // Function to stop aiming and shoot (only for deliberate release)
    const stopAimingAndShoot = () => {
        if (scene.currentPlayerTurret && scene.currentPlayerTurret.isAiming) {
            const shootData = scene.currentPlayerTurret.stopAiming();
            console.log(`Shooting at angle: ${Phaser.Math.RadToDeg(shootData.angle)} degrees, power: ${Math.round(shootData.power * 100)}%`);
            
            // Launch projectile from turret gun tip
            const tipPosition = scene.currentPlayerTurret.getGunTipPosition();
            const projectile = createProjectile(scene, tipPosition.x, tipPosition.y, shootData.angle, shootData.power);
            
            // Store reference to firing turret for tooltip management
            projectile.firingTurret = scene.currentPlayerTurret;
            
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
            
            scene.currentPlayerTurret = null;
        }
    };
    
    // Function to cancel aiming without shooting (for interruptions)
    const cancelAiming = () => {
        if (scene.currentPlayerTurret && scene.currentPlayerTurret.isAiming) {
            scene.currentPlayerTurret.stopAiming(); // Just stop aiming, don't shoot
            scene.currentPlayerTurret = null;
        }
    };
    
    // Mouse/touch controls for camera panning
    scene.input.on('pointerdown', (pointer) => {
        // Always allow turret clicking, even when following projectile
        // Single touch/mouse: check if we clicked on a turret first
        /** @type {any} */
        let clickedTurret = null;
        scene.turrets.forEach(turret => {
            const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, turret.x, turret.y);
            if (distance < 30) { // 30px radius
                clickedTurret = turret;
            }
        });
        
        if (clickedTurret) {
            // Start aiming
            console.log(`Clicked on ${clickedTurret.team} turret`);
            scene.currentPlayerTurret = clickedTurret;
            clickedTurret.startAiming();
            return; // Exit early if we clicked a turret
        }
        
        // Skip camera controls if following projectile
        if (scene.cameraControls && scene.cameraControls.followingProjectile) {
            return;
        }
        
        // Track active pointers for multi-touch detection
        activePointers.add(pointer.id);
        
        // If we have 2+ fingers, start panning instead of aiming/dragging
        if (activePointers.size >= 2) {
            // Cancel any aiming or single-finger dragging
            cancelAiming();
            stopDragging();
            
            // Start multi-touch panning
            if (!isPanning) {
                isPanning = true;
                panStartX = pointer.x;
                panStartY = pointer.y;
                panCameraStartX = scene.cameras.main.scrollX;
                panCameraStartY = scene.cameras.main.scrollY;
            }
            return;
        }
        
        // Start camera dragging (single touch/mouse)
        isDragging = true;
        dragStartX = pointer.x;
        dragStartY = pointer.y;
        cameraStartX = scene.cameras.main.scrollX;
        cameraStartY = scene.cameras.main.scrollY;
    });
    
    scene.input.on('pointerup', (pointer) => {
        // Remove pointer from active set
        activePointers.delete(pointer.id);
        
        // If no more pointers, stop panning
        if (activePointers.size === 0) {
            stopPanning();
        }
        
        // Only process shooting/dragging if we're not in multi-touch mode
        if (activePointers.size < 2) {
            stopAimingAndShoot(); // Deliberate release = shoot
            stopDragging();
        }
    });
    
    scene.input.on('pointermove', (pointer) => {
        // Skip camera controls if following projectile
        if (scene.cameraControls && scene.cameraControls.followingProjectile) {
            // Still allow aiming if player is actively aiming
            if (scene.currentPlayerTurret && scene.currentPlayerTurret.isAiming && activePointers.size < 2) {
                scene.currentPlayerTurret.updateAim(pointer.worldX, pointer.worldY);
            }
            return;
        }
        
        if (isPanning && activePointers.size >= 2) {
            // Multi-touch panning mode
            const deltaX = pointer.x - panStartX;
            const deltaY = pointer.y - panStartY;
            
            scene.cameras.main.scrollX = panCameraStartX - deltaX;
            scene.cameras.main.scrollY = panCameraStartY - deltaY;
        } else if (scene.currentPlayerTurret && scene.currentPlayerTurret.isAiming && activePointers.size < 2) {
            // Aiming mode (single touch only)
            scene.currentPlayerTurret.updateAim(pointer.worldX, pointer.worldY);
        } else if (isDragging && !isPanning && activePointers.size < 2) {
            // Camera panning mode (single touch/mouse drag)
            const deltaX = pointer.x - dragStartX;
            const deltaY = pointer.y - dragStartY;
            
            scene.cameras.main.scrollX = cameraStartX - deltaX;
            scene.cameras.main.scrollY = cameraStartY - deltaY;
        }
    });
    
    // MacBook trackpad gesture support
    scene.game.canvas.addEventListener('wheel', (event) => {
        // Check if this is a trackpad gesture (has deltaX/deltaY and ctrlKey for pinch)
        if (Math.abs(event.deltaX) > 0 || Math.abs(event.deltaY) > 0) {
            // Prevent default scrolling behavior
            event.preventDefault();
            
            // Use wheel delta for camera panning
            const sensitivity = 2; // Adjust for desired pan speed
            scene.cameras.main.scrollX += event.deltaX * sensitivity;
            scene.cameras.main.scrollY += event.deltaY * sensitivity;
            
            // Cancel any active aiming when trackpad panning
            if (scene.currentPlayerTurret && scene.currentPlayerTurret.isAiming) {
                cancelAiming();
            }
        }
    }, { passive: false });
    
    // Handle mouse leaving the game area or window losing focus
    // These events fire when mouse goes outside browser window
    scene.input.on('pointerupoutside', (pointer) => {
        // Remove pointer from active set
        activePointers.delete(pointer.id);
        
        if (activePointers.size === 0) {
            cancelAiming(); // Interrupted = cancel, don't shoot
            stopDragging();
            stopPanning(); // Also stop panning when leaving area
        }
    });
    
    // Handle window losing focus (Alt+Tab, etc.)
    window.addEventListener('blur', () => {
        cancelAiming(); // Interrupted = cancel, don't shoot
        stopDragging();
        stopPanning(); // Also stop panning on focus loss
        activePointers.clear(); // Clear all active pointers
    });
    
    // Handle mouse leaving the canvas entirely
    scene.game.canvas.addEventListener('mouseleave', () => {
        cancelAiming(); // Interrupted = cancel, don't shoot
        stopDragging();
        stopPanning(); // Also stop panning when leaving canvas
        activePointers.clear(); // Clear all active pointers
    });
    
    // Keyboard controls for camera
    const cursors = scene.input.keyboard.createCursorKeys();
    const wasd = scene.input.keyboard.addKeys('W,S,A,D');
    
    // Store for use in update loop
    scene.cameraControls = {
        cursors,
        wasd,
        isDragging: () => isDragging,
        isPanning: () => isPanning,
        followingProjectile: false  // Flag to disable manual camera controls during projectile flight
    };
}

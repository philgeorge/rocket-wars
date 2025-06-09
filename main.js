// main.js
// Entry point for Rocket Wars game logic

import { generateLandscapePoints, drawLandscape, drawWorldBoundaries } from './landscape.js';
import { createGunTurret, placeTurretsOnBases } from './turret.js';
import { createProjectile, updateProjectileTrail, drawProjectileTrail, createExplosion, checkProjectileCollisions, cleanupProjectile } from './projectile.js';

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
            gravity: { y: 300 },
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

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 600;

const game = new Phaser.Game(config);

function preload() {
    // Create a simple 1x1 white pixel texture for particles
    this.add.graphics()
        .fillStyle(0xffffff)
        .fillRect(0, 0, 1, 1)
        .generateTexture('pixel', 1, 1);
}

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
    const numPoints = 40;
    const { points, flatBases } = generateLandscapePoints(WORLD_WIDTH, baseY, numPoints);
    drawLandscape(graphics, points, WORLD_WIDTH, WORLD_HEIGHT, flatBases);
    
    // Mark the world boundaries
    drawWorldBoundaries(graphics, WORLD_WIDTH, WORLD_HEIGHT);

    // Create and place gun turrets on the flat bases
    const turrets = placeTurretsOnBases(this, flatBases, points);
    console.log(`Created ${turrets.length} turrets:`, turrets.map(t => ({team: t.team, x: t.x, y: t.y})));
    
    // Store turrets for access in input handlers
    this.turrets = turrets;
    this.currentPlayerTurret = null;
    
    // Store projectiles for physics updates
    this.projectiles = [];
    
    // Store landscape data for collision detection
    this.landscapeData = { points, flatBases };
    
    // Set up camera controls and input
    setupCameraAndInput(this);

    // Start camera focused on the left turret (player 1)
    if (turrets.length > 0) {
        this.cameras.main.centerOn(turrets[0].x, turrets[0].y);
    }
}

function update() {
    // Camera controls are handled in setupCameraAndInput
    
    // Update projectiles
    if (this.projectiles) {
        // Update each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Update trail effect
            updateProjectileTrail(projectile);
            drawProjectileTrail(this, projectile);
            
            // Check for collisions
            const collisions = checkProjectileCollisions(this, projectile, this.landscapeData, this.turrets);
            
            // Check if projectile should be removed
            let shouldRemove = false;
            
            if (collisions.terrain) {
                console.log('Projectile hit terrain!');
                createExplosion(this, projectile.x, projectile.y, 25);
                shouldRemove = true;
            } else if (collisions.turret) {
                console.log(`Projectile hit ${collisions.turret.team} turret!`);
                createExplosion(this, projectile.x, projectile.y, 30);
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
                cleanupProjectile(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    // Keyboard camera movement
    if (this.cameraControls && !this.cameraControls.isDragging() && !this.cameraControls.isPanning() && !this.currentPlayerTurret) {
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
            
            // Add projectile to scene's projectile list for tracking
            if (!scene.projectiles) {
                scene.projectiles = [];
            }
            scene.projectiles.push(projectile);
            
            console.log(`Projectile launched from (${Math.round(tipPosition.x)}, ${Math.round(tipPosition.y)})`);
            
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
        
        // Single touch/mouse: check if we clicked on a turret first
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
        } else {
            // Start camera dragging (single touch/mouse)
            isDragging = true;
            dragStartX = pointer.x;
            dragStartY = pointer.y;
            cameraStartX = scene.cameras.main.scrollX;
            cameraStartY = scene.cameras.main.scrollY;
        }
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
        isPanning: () => isPanning
    };
}

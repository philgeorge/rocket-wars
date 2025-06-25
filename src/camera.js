// camera.js
// Camera controls and input handling for Rocket Wars

/**
 * Camera controls object with methods and state
 * @typedef {Object} CameraControls
 * @property {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Arrow key controls
 * @property {Object} wasd - WASD key controls
 * @property {Function} isDragging - Returns true if camera is being dragged
 * @property {Function} isPanning - Returns true if camera is being panned (multi-touch)
 * @property {boolean} followingProjectile - Flag to disable manual controls during projectile flight
 * @property {Function} disable - Disable camera controls for player setup
 * @property {Function} enable - Re-enable camera controls after player setup
 */

/**
 * Setup camera controls and input handling for the game scene
 * @param {Phaser.Scene & {turrets?: any[], currentPlayerTurret?: any, projectiles?: any[], gameState?: any, environmentPanel?: any, playerStatsPanel?: any, cameraControls?: any}} scene - The Phaser scene
 * @param {Function} onShoot - Callback function called when player shoots (receives turret and shoot data)
 * @returns {CameraControls} Camera controls object
 */
export function setupCameraAndInput(scene, onShoot) {
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
            
            // Call the provided callback to handle shooting logic
            if (onShoot) {
                onShoot(scene.currentPlayerTurret, shootData);
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
        console.log('🎮 Global pointerdown handler triggered');        
        console.log('Turrets exist:', !!scene.turrets, 'Turrets length:', scene.turrets ? scene.turrets.length : 'N/A');
        
        // Only handle turret interactions if turrets exist (after player setup)
        /** @type {any} */
        let clickedTurret = null;
        if (scene.turrets) {
            scene.turrets.forEach(turret => {
                const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, turret.x, turret.y);
                if (distance < 30) { // 30px radius
                    clickedTurret = turret;
                }
            });
        }
        
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
    
    // Return camera controls object
    return {
        cursors,
        wasd,
        isDragging: () => isDragging,
        isPanning: () => isPanning,
        followingProjectile: false,  // Flag to disable manual camera controls during projectile flight
        
        // Methods to enable/disable camera controls during setup
        disable: () => {
            console.log('🚫 Disabling camera controls for player setup');
            // Disable WASD keys by removing them from the keyboard manager
            scene.input.keyboard.removeKey('W');
            scene.input.keyboard.removeKey('A');
            scene.input.keyboard.removeKey('S');
            scene.input.keyboard.removeKey('D');
            // Clear the wasd object
            scene.cameraControls.wasd = null;
            
            // Also disable global keyboard capture to prevent interference with DOM inputs
            scene.input.keyboard.enabled = false;
            console.log('🚫 Disabled Phaser keyboard input entirely');
        },
        
        enable: () => {
            console.log('✅ Re-enabling camera controls after player setup');
            // Re-enable global keyboard capture
            scene.input.keyboard.enabled = true;
            // Re-add WASD keys
            scene.cameraControls.wasd = scene.input.keyboard.addKeys('W,S,A,D');
            console.log('✅ Re-enabled Phaser keyboard input');
        }
    };
}

/**
 * Update camera to follow projectile with smooth lerping
 * @param {Phaser.Scene & {cameraControls?: any}} scene - The Phaser scene
 * @param {Array} projectiles - Array of active projectiles
 */
export function updateProjectileCamera(scene, projectiles) {
    // Camera follows the projectile (smooth following for better mobile experience)
    if (projectiles.length > 0) {
        // Get the first (newest) projectile to follow
        const activeProjectile = projectiles[0];
        
        // Smooth camera following with lerp for cinematic effect
        const camera = scene.cameras.main;
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
        if (scene.cameraControls) {
            scene.cameraControls.followingProjectile = true;
        }
    }
}

/**
 * Handle keyboard camera movement in the update loop
 * @param {Phaser.Scene & {cameraControls?: any, currentPlayerTurret?: any}} scene - The Phaser scene
 */
export function updateKeyboardCamera(scene) {
    // Keyboard camera movement (disabled while following projectile or when keyboard is disabled)
    if (scene.cameraControls && scene.input.keyboard.enabled && 
        !scene.cameraControls.isDragging() && !scene.cameraControls.isPanning() && 
        !scene.currentPlayerTurret && !scene.cameraControls.followingProjectile) {
        
        const camera = scene.cameras.main;
        const speed = 5;
        
        if (scene.cameraControls.cursors.left.isDown || (scene.cameraControls.wasd && scene.cameraControls.wasd.A.isDown)) {
            camera.scrollX -= speed;
        }
        if (scene.cameraControls.cursors.right.isDown || (scene.cameraControls.wasd && scene.cameraControls.wasd.D.isDown)) {
            camera.scrollX += speed;
        }
        if (scene.cameraControls.cursors.up.isDown || (scene.cameraControls.wasd && scene.cameraControls.wasd.W.isDown)) {
            camera.scrollY -= speed;
        }
        if (scene.cameraControls.cursors.down.isDown || (scene.cameraControls.wasd && scene.cameraControls.wasd.S.isDown)) {
            camera.scrollY += speed;
        }
    }
}

/**
 * Setup camera bounds and physics world bounds for the game
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} worldWidth - World width in pixels
 * @param {number} worldHeight - World height in pixels
 */
export function setupWorldBounds(scene, worldWidth, worldHeight) {
    console.log(`Setting up world bounds: ${worldWidth}x${worldHeight}px`);
    
    // Set camera bounds to the world size
    scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    
    // Set physics world bounds
    scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
}

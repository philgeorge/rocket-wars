// camera.js
// Camera controls and input handling for Rocket Wars

import { getCurrentPlayer } from './turnManager.js';

/**
 * Camera controls object with methods and state
 * @typedef {Object} CameraControls
 * @property {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Arrow key controls
 * @property {Object} wasd - WASD key controls
 * @property {Phaser.Input.Keyboard.Key} enterKey - Enter key for keyboard aiming
 * @property {Function} isDragging - Returns true if camera is being dragged
 * @property {Function} isPanning - Returns true if camera is being panned (multi-touch)
 * @property {boolean} followingProjectile - Flag to disable manual controls during projectile flight
 * @property {Function} updateMomentum - Update momentum scrolling physics
 * @property {Function} disable - Disable camera controls for player setup
 * @property {Function} enable - Re-enable camera controls after player setup
 */

/**
 * Setup camera controls and input handling for the game scene
 * @param {Phaser.Scene & {turrets?: any[], currentPlayerTurret?: any, projectiles?: any[], gameState?: any, environmentPanel?: any, playerStatsPanel?: any, cameraControls?: any, onShoot?: Function, startPlayerAiming?: Function, stopAimingAndShoot?: Function}} scene - The Phaser scene
 * @param {Function} onShoot - Callback function called when player shoots (receives turret and shoot data)
 * @returns {CameraControls} Camera controls object
 */
export function setupCameraAndInput(scene, onShoot) {
    // Store the onShoot callback on the scene for use in keyboard aiming
    scene.onShoot = onShoot;
    
    // Helper function to start aiming for the current player
    const startPlayerAiming = (isKeyboardMode = false) => {
        if (!scene.gameState || !scene.turrets) {
            console.warn('⚠️ Cannot start aiming - game state or turrets not available');
            return false;
        }
        
        const currentPlayerNum = getCurrentPlayer(scene.gameState);
        const currentPlayerKey = `player${currentPlayerNum}`;
        
        // Check if this player has already fired this turn
        if (scene.gameState.hasPlayerFiredThisTurn) {
            console.log(`🚫 Player ${currentPlayerNum} has already fired this turn`);
            return false;
        }
        
        // Find the active player's turret
        const activeTurret = scene.turrets.find(turret => turret.team === currentPlayerKey);
        
        if (!activeTurret) {
            console.warn(`⚠️ Could not find turret for active player ${currentPlayerKey}`);
            return false;
        }
        
        // Start aiming
        console.log(`${isKeyboardMode ? '⌨️' : '🖱️'} Starting ${isKeyboardMode ? 'keyboard' : 'mouse'} aiming for ${currentPlayerKey}`);
        scene.currentPlayerTurret = activeTurret;
        
        if (isKeyboardMode) {
            // We'll add startKeyboardAiming() method in Step 3
            if (activeTurret.startKeyboardAiming) {
                activeTurret.startKeyboardAiming();
            } else {
                // Fallback to regular aiming for now
                activeTurret.startAiming();
                activeTurret.isKeyboardAiming = true;
            }
        } else {
            activeTurret.startAiming();
            // Stop momentum when starting to aim for precision
            momentumActive = false;
            momentumVelocityX = 0;
            momentumVelocityY = 0;
        }
        
        return true;
    };
    
    // Helper function to stop aiming and shoot
    const stopAimingAndShoot = (isKeyboardMode = false) => {
        if (!scene.currentPlayerTurret) {
            return;
        }
        
        console.log(`${isKeyboardMode ? '⌨️' : '🖱️'} Stopping ${isKeyboardMode ? 'keyboard' : 'mouse'} aiming and shooting`);
        const shootData = scene.currentPlayerTurret.stopAiming();
        
        // Call the shoot callback
        if (scene.onShoot) {
            scene.onShoot(scene.currentPlayerTurret, shootData);
        }
        
        scene.currentPlayerTurret = null;
    };
    
    // Store helper functions on the scene for use in updateKeyboardCamera
    scene.startPlayerAiming = startPlayerAiming;
    scene.stopAimingAndShoot = stopAimingAndShoot;
    
    // Camera drag controls
    let isDragging = false;
    let dragStartX, dragStartY;
    let cameraStartX, cameraStartY;
    
    // Momentum scrolling variables
    let momentumVelocityX = 0;
    let momentumVelocityY = 0;
    let lastCalculatedVelocityX = 0; // Preserve last calculated velocity
    let lastCalculatedVelocityY = 0; // Preserve last calculated velocity
    let lastMoveTime = 0;
    let lastMoveX = 0;
    let lastMoveY = 0;
    let momentumActive = false;
    // Keep a short history of recent movements for better velocity calculation
    let moveHistory = [];
    const momentumDecay = 0.94; // How quickly momentum slows down (increased from 0.92 for longer effect)
    const momentumThreshold = 0.1; // Stop momentum when velocity is very low (reduced from 0.5)
    const maxMomentumSpeed = 20; // Maximum momentum speed per frame (increased from 15)
    
    // Multi-touch pan/scroll controls
    let isPanning = false;
    let panStartX, panStartY;
    let panCameraStartX, panCameraStartY;
    let activePointers = new Set(); // Track active touch points
    
    // Function to stop dragging (used by multiple events)
    const stopDragging = () => {
        if (isDragging) {
            const currentTime = Date.now();
            const timeDelta = currentTime - lastMoveTime;
            
            // Use the last calculated velocity instead of current momentum values
            const finalVelocityX = lastCalculatedVelocityX;
            const finalVelocityY = lastCalculatedVelocityY;
            
            // Use the preserved velocity and only apply momentum if movement was recent (within 100ms)
            if (timeDelta < 100 && (Math.abs(finalVelocityX) > momentumThreshold || Math.abs(finalVelocityY) > momentumThreshold)) {
                // Cap momentum to reasonable speeds
                momentumVelocityX = Math.max(-maxMomentumSpeed, Math.min(maxMomentumSpeed, finalVelocityX));
                momentumVelocityY = Math.max(-maxMomentumSpeed, Math.min(maxMomentumSpeed, finalVelocityY));
                
                momentumActive = true;
            } else {
                momentumVelocityX = 0;
                momentumVelocityY = 0;
            }
        }
        isDragging = false;
    };
    
    // Function to stop panning (used by multi-touch events)
    const stopPanning = () => {
        isPanning = false;
        activePointers.clear();
        // Also stop momentum when multi-touch ends
        momentumActive = false;
        momentumVelocityX = 0;
        momentumVelocityY = 0;
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
            // Check if this turret belongs to the current active player
            if (scene.gameState && scene.gameState.playersAlive) {
                // Only allow interaction if this turret belongs to the current active player
                const currentPlayerNum = getCurrentPlayer(scene.gameState);
                const currentPlayerKey = `player${currentPlayerNum}`;
                
                if (clickedTurret.team !== currentPlayerKey) {
                    console.log(`🚫 Can't use ${clickedTurret.team} turret - it's Player ${currentPlayerNum}'s turn (${currentPlayerKey})`);
                    return; // Exit early - not the active player's turret
                }
            }
            
            // Use the helper function to start aiming
            if (startPlayerAiming(false)) {
                return; // Exit early if we successfully started aiming
            }
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
        
        // Initialize momentum tracking
        lastMoveTime = Date.now();
        lastMoveX = pointer.x;
        lastMoveY = pointer.y;
        momentumVelocityX = 0;
        momentumVelocityY = 0;
        lastCalculatedVelocityX = 0;
        lastCalculatedVelocityY = 0;
        moveHistory = []; // Clear movement history
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
            stopAimingAndShoot(false); // Deliberate release = shoot (mouse mode)
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
            const currentTime = Date.now();
            const deltaX = pointer.x - dragStartX;
            const deltaY = pointer.y - dragStartY;
            
            // Calculate velocity for momentum (pixels per millisecond)
            const timeDelta = currentTime - lastMoveTime;
            if (timeDelta > 0) {
                const moveX = pointer.x - lastMoveX;
                const moveY = pointer.y - lastMoveY;
                
                // Store this movement in history
                moveHistory.push({
                    time: currentTime,
                    x: pointer.x,
                    y: pointer.y,
                    moveX: moveX,
                    moveY: moveY,
                    timeDelta: timeDelta
                });
                
                // Keep only recent movements (last 100ms)
                moveHistory = moveHistory.filter(move => currentTime - move.time < 100);
                
                // Calculate velocity from recent movements
                if (moveHistory.length > 1) {
                    const oldest = moveHistory[0];
                    const newest = moveHistory[moveHistory.length - 1];
                    const totalTime = newest.time - oldest.time;
                    const totalMoveX = newest.x - oldest.x;
                    const totalMoveY = newest.y - oldest.y;
                    
                    if (totalTime > 0) {
                        // Invert velocity since camera moves opposite to pointer movement
                        // Increased multiplier from 16 to 24 for 50% stronger momentum effect
                        momentumVelocityX = -(totalMoveX / totalTime * 24); // Convert to ~60fps equivalent and invert
                        momentumVelocityY = -(totalMoveY / totalTime * 24); // Convert to ~60fps equivalent and invert
                        
                        // Preserve these values for when we stop dragging
                        lastCalculatedVelocityX = momentumVelocityX;
                        lastCalculatedVelocityY = momentumVelocityY;
                    }
                }
                
            }
            
            // Update last move tracking
            lastMoveTime = currentTime;
            lastMoveX = pointer.x;
            lastMoveY = pointer.y;
            
            // Stop any active momentum when actively dragging (but keep velocity for when we stop)
            momentumActive = false;
            
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
            
            // Stop momentum when using trackpad (trackpad has its own momentum)
            momentumActive = false;
            momentumVelocityX = 0;
            momentumVelocityY = 0;
            
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
    const enterKey = scene.input.keyboard.addKey('ENTER');
    
    // Momentum update function (called from main update loop)
    const updateMomentum = () => {
        if (momentumActive && !isDragging && !isPanning && !scene.cameraControls?.followingProjectile) {
            // Apply momentum velocity to camera
            scene.cameras.main.scrollX += momentumVelocityX;
            scene.cameras.main.scrollY += momentumVelocityY;
            
            // Decay momentum
            momentumVelocityX *= momentumDecay;
            momentumVelocityY *= momentumDecay;
            
            // Stop momentum if velocity becomes too small
            if (Math.abs(momentumVelocityX) < momentumThreshold && Math.abs(momentumVelocityY) < momentumThreshold) {
                momentumActive = false;
                momentumVelocityX = 0;
                momentumVelocityY = 0;
            }
        }
    };
    
    // Return camera controls object
    return {
        cursors,
        wasd,
        enterKey,
        isDragging: () => isDragging,
        isPanning: () => isPanning,
        followingProjectile: false,  // Flag to disable manual camera controls during projectile flight
        updateMomentum, // Function to update momentum scrolling
        
        // Methods to enable/disable camera controls during setup
        disable: () => {
            console.log('🚫 Disabling camera controls for player setup');
            // Disable WASD keys by removing them from the keyboard manager
            scene.input.keyboard.removeKey('W');
            scene.input.keyboard.removeKey('A');
            scene.input.keyboard.removeKey('S');
            scene.input.keyboard.removeKey('D');
            scene.input.keyboard.removeKey('ENTER');
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
            scene.cameraControls.enterKey = scene.input.keyboard.addKey('ENTER');
            console.log('✅ Re-enabled Phaser keyboard input');
        }
    };
}

/**
 * Update camera to follow projectile with optimized lerping
 * @param {Phaser.Scene & {cameraControls?: any}} scene - The Phaser scene
 * @param {Array} projectiles - Array of active projectiles
 */
export function updateProjectileCamera(scene, projectiles) {
    // Camera follows the projectile (smooth following for better mobile experience)
    if (projectiles.length > 0) {
        // Get the first (newest) projectile to follow
        const activeProjectile = projectiles[0];
        
        // Performance optimization: Only update camera if projectile is moving fast enough
        const body = activeProjectile.body;
        if (!body || !body.velocity) {
            return; // Skip if no physics body or velocity
        }
        
        const velocityMagnitude = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);
        const minFollowSpeed = 100; // Minimum speed to trigger camera following (pixels/second)
        
        // Skip camera updates for slow-moving projectiles (reduces jerkiness at arc peaks)
        if (velocityMagnitude < minFollowSpeed) {
            return;
        }
        
        const camera = scene.cameras.main;
        const lerpFactor = 0.08; // Adjust for smoothness (0.05-0.15 works well)
        
        // Calculate target position (slightly ahead of projectile based on velocity direction)
        const leadDistance = 100; // How far ahead to look
        let targetX = activeProjectile.x;
        let targetY = activeProjectile.y;
        
        // Add leading prediction based on velocity (only for fast-moving projectiles)
        if (velocityMagnitude > 50) { // Only lead if moving fast enough
            const normalizedVelX = body.velocity.x / velocityMagnitude;
            const normalizedVelY = body.velocity.y / velocityMagnitude;
            targetX += normalizedVelX * leadDistance;
            targetY += normalizedVelY * leadDistance;
        }
        
        // Calculate current camera center
        const currentX = camera.scrollX + camera.width / 2;
        const currentY = camera.scrollY + camera.height / 2;
        
        // Performance optimization: Only move camera if the distance is significant
        const distanceToTarget = Math.sqrt((targetX - currentX) ** 2 + (targetY - currentY) ** 2);
        const minMoveDistance = 20; // Minimum distance to trigger camera movement (pixels)
        
        // Skip tiny camera adjustments that cause jerkiness
        if (distanceToTarget < minMoveDistance) {
            return;
        }
        
        // Smoothly move camera towards target
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
 * Handle keyboard camera movement and momentum in the update loop
 * @param {Phaser.Scene & {cameraControls?: any, currentPlayerTurret?: any, gameState?: any, turrets?: any[], onShoot?: Function, startPlayerAiming?: Function, stopAimingAndShoot?: Function}} scene - The Phaser scene
 */
export function updateKeyboardCamera(scene) {
    // Update momentum scrolling
    if (scene.cameraControls && scene.cameraControls.updateMomentum) {
        scene.cameraControls.updateMomentum();
    }
    
    // Handle Enter key for keyboard aiming
    if (scene.cameraControls && scene.cameraControls.enterKey && scene.input.keyboard.enabled && scene.gameState && scene.turrets) {
        // Check if Enter key was just pressed
        if (Phaser.Input.Keyboard.JustDown(scene.cameraControls.enterKey)) {
            if (!scene.currentPlayerTurret) {
                // Start keyboard aiming using the helper function
                scene.startPlayerAiming?.(true);
            } else {
                // Stop keyboard aiming and shoot using the helper function
                scene.stopAimingAndShoot?.(true);
            }
        }
    }
    
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

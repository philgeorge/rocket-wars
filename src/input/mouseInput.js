// mouseInput.js
// Mouse and touch input handling for Rocket Wars

import { getCurrentPlayer } from '../turnManager.js';

/**
 * Mouse input handler object
 * @typedef {Object} MouseInputHandler
 * @property {Function} isDragging - Returns true if camera is being dragged
 * @property {Function} isPanning - Returns true if camera is being panned (multi-touch)
 * @property {Function} updateMomentum - Update momentum scrolling physics
 * @property {Function} stopDragging - Stop camera dragging
 * @property {Function} stopPanning - Stop camera panning
 * @property {Function} cancelAiming - Cancel aiming without shooting
 */

/**
 * Setup mouse and touch input handling for the game scene
 * @param {Phaser.Scene & {turrets?: any[], currentPlayerTurret?: any, gameState?: any, cameraControls?: any, onShoot?: Function, startPlayerAiming?: Function, stopAimingAndShoot?: Function}} scene - The Phaser scene
 * @param {Function} startPlayerAiming - Function to start player aiming
 * @param {Function} stopAimingAndShoot - Function to stop aiming and shoot
 * @returns {MouseInputHandler} Mouse input handler
 */
export function setupMouseInput(scene, startPlayerAiming, stopAimingAndShoot) {
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
    const activePointers = new Set(); // Track active touch points
    
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
    
    // Mouse/touch controls for camera panning and turret interaction
    scene.input.on('pointerdown', (pointer) => {
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
    
    return {
        isDragging: () => isDragging,
        isPanning: () => isPanning,
        updateMomentum,
        
        // Expose functions for external access
        stopDragging,
        stopPanning,
        cancelAiming
    };
}

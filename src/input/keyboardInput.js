// keyboardInput.js
// Keyboard input handling for Rocket Wars

import { getCurrentPlayer } from '../turnManager.js';
import { info, trace } from '../logger.js';

/**
 * Keyboard input handler object
 * @typedef {Object} KeyboardInputHandler
 * @property {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Arrow key controls
 * @property {Object} wasd - WASD key controls
 * @property {Phaser.Input.Keyboard.Key} enterKey - Enter key for keyboard aiming
 * @property {Phaser.Input.Keyboard.Key} escKey - ESC key to cancel aiming
 * @property {Phaser.Input.Keyboard.Key} tKey - T key for teleportation
 * @property {Function} update - Update keyboard input state
 * @property {Function} disable - Disable keyboard input
 * @property {Function} enable - Re-enable keyboard input
 */

/**
 * Setup keyboard input handling for the game scene
 * @param {Phaser.Scene & {turrets?: any[], currentPlayerTurret?: any, gameState?: any, gameEnded?: boolean, cameraControls?: any, onShoot?: Function, startPlayerAiming?: Function, stopAimingAndShoot?: Function, enterTeleportMode?: Function, exitTeleportMode?: Function, isTeleportMode?: Function}} scene - The Phaser scene
 * @param {Object} cameraControls - Camera controls object for coordination
 * @returns {KeyboardInputHandler} Keyboard input handler
 */
export function setupKeyboardInput(scene, cameraControls) {
    // Create keyboard controls
    const cursors = scene.input.keyboard.createCursorKeys();
    const wasd = scene.input.keyboard.addKeys('W,S,A,D');
    const enterKey = scene.input.keyboard.addKey('ENTER');
    const escKey = scene.input.keyboard.addKey('ESC');
    const tKey = scene.input.keyboard.addKey('T');
    
    /**
     * Handle keyboard input updates
     * @param {Phaser.Scene & {cameraControls?: any, currentPlayerTurret?: any, gameState?: any, turrets?: any[], gameEnded?: boolean, onShoot?: Function, startPlayerAiming?: Function, stopAimingAndShoot?: Function, enterTeleportMode?: Function, exitTeleportMode?: Function, isTeleportMode?: Function}} scene - The Phaser scene
     */
    const updateKeyboardInput = (scene) => {
        // Handle Enter key for keyboard aiming
        if (enterKey && scene.input.keyboard.enabled && scene.gameState && scene.turrets) {
            // Check if Enter key was just pressed
            if (Phaser.Input.Keyboard.JustDown(enterKey)) {
                if (!scene.currentPlayerTurret) {
                    // Start keyboard aiming using the helper function
                    scene.startPlayerAiming?.(true);
                } else {
                    // Stop keyboard aiming and shoot using the helper function
                    scene.stopAimingAndShoot?.(true);
                }
            }
        }
        
        // Handle T key for teleportation toggle
        if (tKey && scene.input.keyboard.enabled && scene.gameState && scene.turrets && !scene.gameEnded) {
            // Check if T key was just pressed
            if (Phaser.Input.Keyboard.JustDown(tKey)) {
                info('🔄 T key pressed - toggling teleport mode');
                
                // Toggle teleport mode (same logic as the button)
                if (scene.isTeleportMode && scene.isTeleportMode()) {
                    // Currently in teleport mode - exit it
                    const success = scene.exitTeleportMode();
                    if (success) {
                        info(`↩️ Player exited teleport mode via T key`);
                    }
                } else {
                    // Not in teleport mode - enter it
                    const success = scene.enterTeleportMode();
                    if (success) {
                        const currentPlayerNum = getCurrentPlayer(scene.gameState);
                        info(`✅ Player ${currentPlayerNum} entered teleport mode via T key`);
                    }
                }
            }
        }
        
        // Handle ESC key to cancel aiming or teleport mode
        if (escKey && scene.input.keyboard.enabled) {
            // Check if ESC key was just pressed
            if (Phaser.Input.Keyboard.JustDown(escKey)) {
                // First check for teleport mode cancellation
                if (scene.gameState && scene.gameState.teleportMode) {
                    info('🚫 ESC key pressed - canceling teleport mode');
                    scene.exitTeleportMode();
                    
                } else if (scene.currentPlayerTurret) {
                    // Cancel aiming if player is aiming
                    info('🚫 ESC key pressed - canceling keyboard aiming');
                    
                    // Cancel aiming without shooting
                    if (scene.currentPlayerTurret.isAiming) {
                        scene.currentPlayerTurret.stopAiming(); // Just stop aiming, don't shoot
                    }
                    
                    // Clear current player turret to return to camera scroll mode
                    scene.currentPlayerTurret = null;
                }
            }
        }
        
        // Handle arrow key controls for keyboard aiming
        if (scene.currentPlayerTurret && scene.currentPlayerTurret.isKeyboardAiming && scene.input.keyboard.enabled) {
            handleKeyboardAiming(scene, cursors, wasd);
        }
        
        // Handle keyboard camera movement (disabled while following projectile, when keyboard is disabled, or during keyboard aiming)
        if (scene.input.keyboard.enabled && 
            !cameraControls.isDragging() && !cameraControls.isPanning() && 
            !scene.currentPlayerTurret && !cameraControls.followingProjectile) {
            
            handleKeyboardCameraMovement(scene, cursors, wasd);
        }
    };
    
    return {
        cursors,
        wasd,
        enterKey,
        escKey,
        tKey,
        update: updateKeyboardInput,
        
        disable: () => {
            info('🚫 Disabling keyboard input');
            // Disable WASD keys by removing them from the keyboard manager
            scene.input.keyboard.removeKey('W');
            scene.input.keyboard.removeKey('A');
            scene.input.keyboard.removeKey('S');
            scene.input.keyboard.removeKey('D');
            scene.input.keyboard.removeKey('ENTER');
            scene.input.keyboard.removeKey('ESC');
            scene.input.keyboard.removeKey('T');
            
            // Also disable global keyboard capture to prevent interference with DOM inputs
            scene.input.keyboard.enabled = false;
            trace('🚫 Disabled Phaser keyboard input entirely');
        },
        
        enable: () => {
            info('✅ Re-enabling keyboard input');
            // Re-enable global keyboard capture
            scene.input.keyboard.enabled = true;
            // Re-add keys
            // Note: These will be recreated by the caller
            trace('✅ Re-enabled Phaser keyboard input');
        }
    };
}

/**
 * Handle keyboard aiming controls
 * @param {Phaser.Scene & {currentPlayerTurret?: any}} scene - The Phaser scene
 * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Arrow key controls
 * @param {Object} wasd - WASD key controls
 */
function handleKeyboardAiming(scene, cursors, wasd) {
    const turret = scene.currentPlayerTurret;
    
    // Initialize key hold tracking if not exists
    if (!turret.keyHoldState) {
        turret.keyHoldState = {
            leftHeld: false,
            rightHeld: false,
            upHeld: false,
            downHeld: false,
            leftHoldTime: 0,
            rightHoldTime: 0,
            upHoldTime: 0,
            downHoldTime: 0,
            lastUpdateTime: 0
        };
    }
    
    const currentTime = scene.time.now;
    const deltaTime = currentTime - turret.keyHoldState.lastUpdateTime;
    turret.keyHoldState.lastUpdateTime = currentTime;
    
    // Check key states and update hold times
    const leftPressed = cursors.left.isDown || (wasd && wasd.A.isDown);
    const rightPressed = cursors.right.isDown || (wasd && wasd.D.isDown);
    const upPressed = cursors.up.isDown || (wasd && wasd.W.isDown);
    const downPressed = cursors.down.isDown || (wasd && wasd.S.isDown);
    
    // Update hold times
    turret.keyHoldState.leftHoldTime = leftPressed ? turret.keyHoldState.leftHoldTime + deltaTime : 0;
    turret.keyHoldState.rightHoldTime = rightPressed ? turret.keyHoldState.rightHoldTime + deltaTime : 0;
    turret.keyHoldState.upHoldTime = upPressed ? turret.keyHoldState.upHoldTime + deltaTime : 0;
    turret.keyHoldState.downHoldTime = downPressed ? turret.keyHoldState.downHoldTime + deltaTime : 0;
    
    // Determine if we should trigger an adjustment (either just pressed or held long enough)
    const holdThreshold = 500; // 500ms before faster adjustment kicks in
    const fastRepeatInterval = 50; // Repeat every 50ms when held (20 times per second)
    const superFastThreshold = 1000; // 1000ms before super fast adjustment kicks in
    const superFastRepeatInterval = 20; // Repeat every 20ms when held long (50 times per second)
    
    // Helper function to determine if a key should trigger an adjustment
    const shouldAdjustForKey = (justPressed, holdTime) => {
        return justPressed || 
               (holdTime > superFastThreshold && 
                Math.floor(holdTime / superFastRepeatInterval) > 
                Math.floor((holdTime - deltaTime) / superFastRepeatInterval)) ||
               (holdTime > holdThreshold && 
                holdTime <= superFastThreshold &&
                Math.floor(holdTime / fastRepeatInterval) > 
                Math.floor((holdTime - deltaTime) / fastRepeatInterval));
    };
    
    let angleChanged = false;
    let powerChanged = false;
    
    // Angle adjustment (Left/Right arrows or A/D keys)
    if (leftPressed) {
        const shouldAdjust = shouldAdjustForKey(
            Phaser.Input.Keyboard.JustDown(cursors.left) || (wasd && Phaser.Input.Keyboard.JustDown(wasd.A)),
            turret.keyHoldState.leftHoldTime
        );
        
        if (shouldAdjust) {
            turret.keyboardAngle = Math.max(-180, turret.keyboardAngle - 1); // Decrease angle (more left)
            angleChanged = true;
        }
    }
    
    if (rightPressed) {
        const shouldAdjust = shouldAdjustForKey(
            Phaser.Input.Keyboard.JustDown(cursors.right) || (wasd && Phaser.Input.Keyboard.JustDown(wasd.D)),
            turret.keyHoldState.rightHoldTime
        );
        
        if (shouldAdjust) {
            turret.keyboardAngle = Math.min(0, turret.keyboardAngle + 1); // Increase angle (more right)
            angleChanged = true;
        }
    }
    
    // Power adjustment (Up/Down arrows or W/S keys)
    if (upPressed) {
        const shouldAdjust = shouldAdjustForKey(
            Phaser.Input.Keyboard.JustDown(cursors.up) || (wasd && Phaser.Input.Keyboard.JustDown(wasd.W)),
            turret.keyHoldState.upHoldTime
        );
        
        if (shouldAdjust) {
            turret.keyboardPower = Math.min(1.0, turret.keyboardPower + 0.01); // Increase power (max 100%)
            powerChanged = true;
        }
    }
    
    if (downPressed) {
        const shouldAdjust = shouldAdjustForKey(
            Phaser.Input.Keyboard.JustDown(cursors.down) || (wasd && Phaser.Input.Keyboard.JustDown(wasd.S)),
            turret.keyHoldState.downHoldTime
        );
        
        if (shouldAdjust) {
            turret.keyboardPower = Math.max(0.1, turret.keyboardPower - 0.01); // Decrease power (min 10%)
            powerChanged = true;
        }
    }
    
    // If angle or power changed, update the visual feedback
    if (angleChanged || powerChanged) {
        // Update the gun angle
        turret.setGunAngle(turret.keyboardAngle);
        
        // Update current power for shooting
        turret.currentPower = turret.keyboardPower;
        
        // Redraw aiming line and tooltip with new values
        const angleInRadians = Phaser.Math.DegToRad(turret.keyboardAngle);
        turret.drawAimingLineAndTooltip(angleInRadians, turret.keyboardPower, true);
        
        trace(`⌨️ Keyboard aiming updated - angle: ${turret.keyboardAngle}°, power: ${Math.round(turret.keyboardPower * 100)}%`);
    }
}

/**
 * Handle keyboard camera movement
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Arrow key controls
 * @param {Object} wasd - WASD key controls
 */
function handleKeyboardCameraMovement(scene, cursors, wasd) {
    const camera = scene.cameras.main;
    const speed = 5;
    
    if (cursors.left.isDown || (wasd && wasd.A.isDown)) {
        camera.scrollX -= speed;
    }
    if (cursors.right.isDown || (wasd && wasd.D.isDown)) {
        camera.scrollX += speed;
    }
    if (cursors.up.isDown || (wasd && wasd.W.isDown)) {
        camera.scrollY -= speed;
    }
    if (cursors.down.isDown || (wasd && wasd.S.isDown)) {
        camera.scrollY += speed;
    }
}

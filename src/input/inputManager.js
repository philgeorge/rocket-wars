// inputManager.js
// Centralized input management for Rocket Wars

import { setupMouseInput } from './mouseInput.js';
import { setupKeyboardInput } from './keyboardInput.js';
import { getCurrentPlayer } from '../turnManager.js';
import { updateGameUI } from '../ui/updateUI.js';
import { info, warn } from '../logger.js';

/**
 * Input manager object
 * @typedef {Object} InputManager
 * @property {Object} mouse - Mouse input handler
 * @property {Object} keyboard - Keyboard input handler
 * @property {Function} update - Update all input handlers
 * @property {Function} disable - Disable all input
 * @property {Function} enable - Re-enable all input
 */

/**
 * Setup centralized input management for the game scene
 * @param {Phaser.Scene & {turrets?: any[], currentPlayerTurret?: any, gameState?: any, cameraControls?: any, onShoot?: Function, startPlayerAiming?: Function, stopAimingAndShoot?: Function, environmentPanel?: any}} scene - The Phaser scene
 * @param {Function} onShoot - Callback function called when player shoots
 * @returns {InputManager} Input manager
 */
export function setupInputManager(scene, onShoot) {
    // Store the onShoot callback on the scene for use in aiming
    scene.onShoot = onShoot;
    
    // Helper function to start aiming for the current player
    const startPlayerAiming = (isKeyboardMode = false) => {
        if (!scene.gameState || !scene.turrets) {
            warn('⚠️ Cannot start aiming - game state or turrets not available');
            return false;
        }
        
        // Block aiming if in teleport mode
        if (scene.gameState.teleportMode) {
            info('🚫 Cannot start aiming - player is in teleport mode');
            return false;
        }
        
        const currentPlayerNum = getCurrentPlayer(scene.gameState);
        const currentPlayerKey = `player${currentPlayerNum}`;
        
        // Check if this player has already fired this turn
        if (scene.gameState.hasPlayerFiredThisTurn) {
            info(`🚫 Player ${currentPlayerNum} has already fired this turn`);
            return false;
        }
        
        // Find the active player's turret
        const activeTurret = scene.turrets.find(turret => turret.team === currentPlayerKey);
        
        if (!activeTurret) {
            warn(`⚠️ Could not find turret for active player ${currentPlayerKey}`);
            return false;
        }
        
        // Start aiming
        info(`${isKeyboardMode ? '⌨️' : '🖱️'} Starting ${isKeyboardMode ? 'keyboard' : 'mouse'} aiming for ${currentPlayerKey}`);
        scene.currentPlayerTurret = activeTurret;
        
        if (isKeyboardMode) {
            activeTurret.startKeyboardAiming();
        } else {
            activeTurret.startAiming();
            // Stop momentum when starting to aim for precision
            mouseInput.stopDragging();
        }

        // Update teleport UI state (centralized)
        updateGameUI(scene, scene.gameState, { updateEnvironment: false, updatePlayers: false, updateTeleport: true });

        return true;
    };
    
    // Helper function to stop aiming and shoot
    const stopAimingAndShoot = (isKeyboardMode = false) => {
        if (!scene.currentPlayerTurret) {
            return;
        }
        
        info(`${isKeyboardMode ? '⌨️' : '🖱️'} Stopping ${isKeyboardMode ? 'keyboard' : 'mouse'} aiming and shooting`);
        const shootData = scene.currentPlayerTurret.stopAiming();
        
        // Call the shoot callback
        if (scene.onShoot) {
            scene.onShoot(scene.currentPlayerTurret, shootData);
        }

        scene.currentPlayerTurret = null;

        // Update teleport UI state (centralized)
        updateGameUI(scene, scene.gameState, { updateEnvironment: false, updatePlayers: false, updateTeleport: true });
    };
    
    // Store helper functions on the scene for use in input handlers
    scene.startPlayerAiming = startPlayerAiming;
    scene.stopAimingAndShoot = stopAimingAndShoot;
    
    // Setup mouse and keyboard input handlers
    const mouseInput = setupMouseInput(scene, startPlayerAiming, stopAimingAndShoot);
    const keyboardInput = setupKeyboardInput(scene, mouseInput);
    
    // Return input manager
    return {
        mouse: mouseInput,
        keyboard: keyboardInput,
        
        update: () => {
            // Update mouse momentum
            mouseInput.updateMomentum();
            
            // Update keyboard input
            keyboardInput.update(scene);
        },
        
        disable: () => {
            info('🚫 Disabling input manager');
            keyboardInput.disable();
        },
        
        enable: () => {
            info('✅ Re-enabling input manager');
            keyboardInput.enable();
            // Re-create keyboard controls after re-enabling
            const newKeyboardInput = setupKeyboardInput(scene, mouseInput);
            return {
                mouse: mouseInput,
                keyboard: newKeyboardInput,
                update: () => {
                    mouseInput.updateMomentum();
                    newKeyboardInput.update(scene);
                },
                disable: () => {
                    newKeyboardInput.disable();
                },
                enable: () => {
                    info('✅ Re-enabling input manager');
                    return setupInputManager(scene, onShoot);
                }
            };
        }
    };
}

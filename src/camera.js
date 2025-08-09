// camera.js
// Camera controls and operations for Rocket Wars

import { setupInputManager } from './input/inputManager.js';
import { info } from './logger.js';

/**
 * Camera controls object with methods and state
 * @typedef {Object} CameraControls
 * @property {Object} input - Input manager for mouse and keyboard
 * @property {boolean} followingProjectile - Flag to disable manual controls during projectile flight
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
    // Setup input manager for mouse and keyboard
    const inputManager = setupInputManager(scene, onShoot);
    
    // Return camera controls object
    return {
        input: inputManager,
        followingProjectile: false,  // Flag to disable manual camera controls during projectile flight
        
        // Methods to enable/disable camera controls during setup
        disable: () => {
            info('🚫 Disabling camera controls for player setup');
            inputManager.disable();
        },
        
        enable: () => {
            info('✅ Re-enabling camera controls after player setup');
            const newInputManager = inputManager.enable();
            // Return updated camera controls with new input manager
            return {
                input: newInputManager,
                followingProjectile: false,
                disable: () => {
                    newInputManager.disable();
                },
                enable: () => {
                    return setupCameraAndInput(scene, onShoot);
                }
            };
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
 * Handle keyboard camera movement and input in the update loop
 * @param {Phaser.Scene & {cameraControls?: any}} scene - The Phaser scene
 */
export function updateKeyboardCamera(scene) {
    // Update input manager (handles both mouse momentum and keyboard input)
    if (scene.cameraControls && scene.cameraControls.input) {
        scene.cameraControls.input.update();
    }
}

/**
 * Setup camera bounds and physics world bounds for the game
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} worldWidth - World width in pixels
 * @param {number} worldHeight - World height in pixels
 */
export function setupWorldBounds(scene, worldWidth, worldHeight) {
    info(`Setting up world bounds: ${worldWidth}x${worldHeight}px`);
    
    // Set camera bounds to the world size
    scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    
    // Set physics world bounds
    scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
}

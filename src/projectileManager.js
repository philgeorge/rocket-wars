// projectileManager.js
// Projectile update and management system for Rocket Wars

import { updateProjectileTrail, drawProjectileTrail, checkProjectileCollisions, cleanupProjectile, calculateDamage, calculateAOEDamage, calculateVelocityFactor, createExplosion } from './projectile.js';
import { applyDamage } from './ui.js';
import { updateProjectileCamera } from './camera.js';

/**
 * Update all projectiles in the scene
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {any[]} projectiles - Array of active projectiles
 * @param {any} gameState - Current game state
 * @param {any} landscapeData - Landscape collision data
 * @param {any[]} turrets - Array of turrets
 * @param {any} cameraControls - Camera control state
 */
export function updateProjectiles(scene, projectiles, gameState, landscapeData, turrets, cameraControls) {
    // Camera follows projectiles with smooth following
    updateProjectileCamera(scene, projectiles);

    // Update each projectile
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];

        // Apply projectile physics
        applyProjectilePhysics(projectile, gameState, scene.time.now);

        // Update trail effect
        updateProjectileTrail(projectile);
        drawProjectileTrail(scene, projectile);

        // Check for collisions
        const collisions = checkProjectileCollisions(scene, projectile, landscapeData, turrets);

        // Handle collisions and determine if projectile should be removed
        const shouldRemove = handleProjectileCollisions(scene, projectile, collisions, gameState, turrets);

        // Remove projectile if needed
        if (shouldRemove) {
            cleanupFinishedProjectile(projectile, projectiles, i, cameraControls);
        }
    }

    // Ensure camera following is disabled when no projectiles remain
    if (projectiles.length === 0 && cameraControls && cameraControls.followingProjectile) {
        console.log('No projectiles remaining - disabling camera following');
        cameraControls.followingProjectile = false;
    }
}

/**
 * Apply physics effects to a projectile (wind, air resistance)
 * @param {any} projectile - The projectile to update
 * @param {any} gameState - Current game state
 * @param {number} currentTime - Current game time
 */
export function applyProjectilePhysics(projectile, gameState, currentTime) {
    if (!gameState || !projectile.body) return;

    const windForce = gameState.wind.current / 100; // Normalize to -1 to +1
    const windAcceleration = windForce * 220; // Wind acceleration (pixels/sec²)

    // Apply wind as horizontal acceleration (accumulated over time)
    projectile.body.acceleration.x = windAcceleration;

    // Optional: Add slight air resistance for more realistic physics
    const airResistance = 0.99; // Slight velocity reduction each frame
    projectile.body.velocity.x *= airResistance;
    projectile.body.velocity.y *= airResistance;

    // Debug: Log wind effect periodically (every 30 frames ≈ 0.5 seconds)
    if (Math.floor(currentTime / 500) > Math.floor((currentTime - 16) / 500)) {
        console.log(`Wind effect: ${gameState.wind.current} units, acceleration: ${windAcceleration.toFixed(1)} px/s²`);
    }
}

/**
 * Handle projectile collisions and return whether projectile should be removed
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {any} projectile - The projectile
 * @param {any} collisions - Collision detection results
 * @param {any} gameState - Current game state
 * @param {any[]} turrets - Array of turrets
 * @returns {boolean} True if projectile should be removed
 */
export function handleProjectileCollisions(scene, projectile, collisions, gameState, turrets) {
    // Get UI panels for updates
    const environmentPanel = /** @type {any} */ (scene).environmentPanel;
    const playerStatsPanel = /** @type {any} */ (scene).playerStatsPanel;

    if (collisions.terrain) {
        return handleTerrainCollision(scene, projectile, gameState, turrets, environmentPanel, playerStatsPanel);
    } else if (collisions.turret) {
        return handleTurretCollision(scene, projectile, collisions, gameState, turrets, environmentPanel, playerStatsPanel);
    } else if (collisions.worldBounds) {
        console.log('Projectile left world bounds');
        return true;
    } else if (scene.time.now - projectile.startTime > projectile.maxFlightTime) {
        console.log('Projectile timed out');
        return true;
    }

    return false;
}

/**
 * Handle terrain collision
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {any} projectile - The projectile
 * @param {any} gameState - Current game state
 * @param {any[]} turrets - Array of turrets
 * @param {any} environmentPanel - Environment panel for updates
 * @param {any} playerStatsPanel - Player stats panel for updates
 * @returns {boolean} True (projectile should be removed)
 */
function handleTerrainCollision(scene, projectile, gameState, turrets, environmentPanel, playerStatsPanel) {
    console.log('Projectile hit terrain!');

    // Calculate velocity-based explosion size (includes visual scaling)
    const velocityFactor = calculateVelocityFactor(projectile);
    const baseExplosionSize = 75; // Minimum explosion size
    const maxExplosionSize = 150; // Maximum explosion size
    const terrainExplosionSize = baseExplosionSize + (maxExplosionSize - baseExplosionSize) * velocityFactor;

    console.log(`🌍 Terrain explosion: velocity factor ${(velocityFactor * 100).toFixed(1)}%, size: ${terrainExplosionSize.toFixed(1)}px`);
    createExplosion(scene, projectile.x, projectile.y, terrainExplosionSize, 'terrain');

    // Check for AOE damage to nearby turrets
    const affectedTurrets = calculateAOEDamage(projectile.x, projectile.y, terrainExplosionSize, turrets);

    // Apply AOE damage to affected turrets
    affectedTurrets.forEach(({ turret, damage }) => {
        applyDamage(gameState, turret.team, damage);
        // Update turret visual health indicator
        if (turret.updateHealthDisplay) {
            turret.updateHealthDisplay(gameState[turret.team].health);
        }
        console.log(`🌊 ${turret.team} turret took ${damage} AOE damage from terrain explosion, health now: ${gameState[turret.team].health}%`);
    });

    // Update panels if any turrets were damaged
    if (affectedTurrets.length > 0) {
        updateGamePanels(environmentPanel, playerStatsPanel, gameState);
    }

    return true;
}

/**
 * Handle turret collision
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {any} projectile - The projectile
 * @param {any} collisions - Collision data
 * @param {any} gameState - Current game state
 * @param {any[]} turrets - Array of turrets
 * @param {any} environmentPanel - Environment panel for updates
 * @param {any} playerStatsPanel - Player stats panel for updates
 * @returns {boolean} True (projectile should be removed)
 */
function handleTurretCollision(scene, projectile, collisions, gameState, turrets, environmentPanel, playerStatsPanel) {
    console.log(`Projectile hit ${collisions.turret.team} turret!`);

    // Calculate dynamic damage based on accuracy and velocity
    const damage = calculateDamage(projectile, collisions.turret, collisions.turretDistance || 0);

    // Calculate velocity-based explosion size
    const velocityFactor = calculateVelocityFactor(projectile);
    const baseExplosionSize = 90; // Minimum explosion size for turret hits
    const maxExplosionSize = 180; // Maximum explosion size for turret hits
    const explosionSize = baseExplosionSize + (maxExplosionSize - baseExplosionSize) * velocityFactor;

    console.log(`🎯 Turret explosion: velocity factor ${(velocityFactor * 100).toFixed(1)}%, size: ${explosionSize.toFixed(1)}px (damage: ${damage})`);
    createExplosion(scene, projectile.x, projectile.y, explosionSize, 'turret');

    // Apply direct damage to hit turret
    applyDamage(gameState, collisions.turret.team, damage);
    // Update turret visual health indicator
    if (collisions.turret.updateHealthDisplay) {
        collisions.turret.updateHealthDisplay(gameState[collisions.turret.team].health);
    }
    console.log(`💥 ${collisions.turret.team} turret took ${damage} direct damage, health now: ${gameState[collisions.turret.team].health}%`);

    // Check for AOE damage to other nearby turrets (excluding the directly hit one)
    const otherTurrets = turrets.filter(t => t !== collisions.turret);
    const affectedTurrets = calculateAOEDamage(projectile.x, projectile.y, explosionSize, otherTurrets);

    // Apply AOE damage to affected turrets
    affectedTurrets.forEach(({ turret, damage: aoeDamage }) => {
        applyDamage(gameState, turret.team, aoeDamage);
        // Update turret visual health indicator
        if (turret.updateHealthDisplay) {
            turret.updateHealthDisplay(gameState[turret.team].health);
        }
        console.log(`🌊 ${turret.team} turret took ${aoeDamage} AOE damage from turret explosion, health now: ${gameState[turret.team].health}%`);
    });

    // Update panel displays
    updateGamePanels(environmentPanel, playerStatsPanel, gameState);

    return true;
}

/**
 * Update game UI panels
 * @param {any} environmentPanel - Environment panel
 * @param {any} playerStatsPanel - Player stats panel
 * @param {any} gameState - Current game state
 */
function updateGamePanels(environmentPanel, playerStatsPanel, gameState) {
    if (environmentPanel && environmentPanel.updateDisplay) {
        environmentPanel.updateDisplay(gameState);
    }
    if (playerStatsPanel && playerStatsPanel.updateDisplay) {
        playerStatsPanel.updateDisplay(gameState);
    }
}

/**
 * Clean up a finished projectile and manage camera state
 * @param {any} projectile - The projectile to clean up
 * @param {any[]} projectiles - Array of all projectiles
 * @param {number} index - Index of projectile to remove
 * @param {any} cameraControls - Camera control state
 */
export function cleanupFinishedProjectile(projectile, projectiles, index, cameraControls) {
    // Trigger tooltip fade for the turret that fired this projectile
    if (projectile.firingTurret && projectile.firingTurret.aimTooltip && projectile.firingTurret.aimTooltip.visible) {
        projectile.firingTurret.hideTooltip(500, 1500); // Shorter delay, faster fade
    }

    cleanupProjectile(projectile);
    projectiles.splice(index, 1);

    // When last projectile is removed, disable camera following
    if (projectiles.length === 1 && cameraControls && cameraControls.followingProjectile) {
        console.log('Last projectile removed - re-enabling camera controls');
        cameraControls.followingProjectile = false;
    }
}

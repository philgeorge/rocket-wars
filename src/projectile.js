// projectile.js
// Projectile physics and graphics for Rocket Wars

/**
 * Create a projectile with physics and visual trail
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} angle - Launch angle in radians
 * @param {number} power - Launch power (0.2 to 1.0)
 * @returns {Phaser.GameObjects.Graphics & {trail: Array<{x: number, y: number, time: number}>, maxTrailLength: number, isProjectile: boolean, startTime: number, maxFlightTime: number, trailGraphics?: Phaser.GameObjects.Graphics, firingTurret?: any}}
 */
export function createProjectile(scene, startX, startY, angle, power) {
    // Create projectile graphics (small rocket/bullet)
    const projectile = /** @type {Phaser.GameObjects.Graphics & {trail: Array<{x: number, y: number, time: number}>, maxTrailLength: number, isProjectile: boolean, startTime: number, maxFlightTime: number, trailGraphics?: Phaser.GameObjects.Graphics, firingTurret?: any}} */ (scene.add.graphics());
    projectile.fillStyle(0xff6b6b, 1); // Reddish color for projectile
    projectile.fillCircle(0, 0, 3); // 3px radius circle
    projectile.lineStyle(1, 0xff4444, 1);
    projectile.strokeCircle(0, 0, 3);
    
    // Position at start location
    projectile.x = startX;
    projectile.y = startY;
    
    // Enable physics on the projectile
    scene.physics.add.existing(projectile);
    /** @type {Phaser.Physics.Arcade.Body} */ (projectile.body).setCircle(3); // Set physics body to match visual circle
    
    // Calculate initial velocity based on angle and power
    // Power ranges from 0.2 to 1.0, let's scale it to reasonable velocity
    const baseVelocity = 100; // Base velocity (pixels per second)
    const maxVelocity = 2000; // Maximum velocity at full power
    const velocity = baseVelocity + (maxVelocity - baseVelocity) * power;
    
    // Convert angle and power to velocity components
    const velocityX = Math.cos(angle) * velocity;
    const velocityY = Math.sin(angle) * velocity;
    
    // Set initial velocity
    /** @type {Phaser.Physics.Arcade.Body} */ (projectile.body).setVelocity(velocityX, velocityY);
    
    // Add some bounce (optional - projectiles can bounce off terrain)
    /** @type {Phaser.Physics.Arcade.Body} */ (projectile.body).setBounce(0.3, 0.3);
    
    // Add trail effect
    projectile.trail = [];
    projectile.maxTrailLength = 15;
    
    // Store projectile data
    projectile.isProjectile = true;
    projectile.startTime = scene.time.now;
    projectile.maxFlightTime = 10000; // 10 seconds max flight time
    
    return projectile;
}

/**
 * Update projectile trail with current position
 * @param {Phaser.GameObjects.Graphics & {trail: Array<{x: number, y: number, time: number}>, maxTrailLength: number}} projectile
 */
export function updateProjectileTrail(projectile) {
    // Add current position to trail
    projectile.trail.push({
        x: projectile.x,
        y: projectile.y,
        time: Date.now()
    });
    
    // Remove old trail points
    while (projectile.trail.length > projectile.maxTrailLength) {
        projectile.trail.shift();
    }
}

/**
 * Draw projectile trail as connected line segments with fading alpha
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Phaser.GameObjects.Graphics & {trail: Array<{x: number, y: number, time: number}>, trailGraphics?: Phaser.GameObjects.Graphics}} projectile
 */
export function drawProjectileTrail(scene, projectile) {
    if (!projectile.trailGraphics) {
        projectile.trailGraphics = scene.add.graphics();
    }
    
    projectile.trailGraphics.clear();
    
    if (projectile.trail.length < 2) return;
    
    // Draw trail as connected line segments with fading alpha
    for (let i = 1; i < projectile.trail.length; i++) {
        const alpha = i / projectile.trail.length; // Fade from 0 to 1
        const lineWidth = alpha * 2; // Thicker lines at front of trail
        
        projectile.trailGraphics.lineStyle(lineWidth, 0xff6b6b, alpha * 0.6);
        
        const prevPoint = projectile.trail[i - 1];
        const currentPoint = projectile.trail[i];
        
        projectile.trailGraphics.beginPath();
        projectile.trailGraphics.moveTo(prevPoint.x, prevPoint.y);
        projectile.trailGraphics.lineTo(currentPoint.x, currentPoint.y);
        projectile.trailGraphics.strokePath();
    }
}

/**
 * Create explosion effect with concentric rings
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} x - Explosion X coordinate
 * @param {number} y - Explosion Y coordinate
 * @param {number} [radius=80] - Maximum explosion radius
 * @param {string} [hitType='turret'] - Type of hit ('terrain' or 'turret') for shake intensity
 * @returns {null}
 */
export function createExplosion(scene, x, y, radius = 80, hitType = 'turret') {
    console.log(`💥 Creating explosion at (${Math.round(x)}, ${Math.round(y)}) with radius ${radius}`);
    
    // Define explosion ring colors (from center outward)
    const ringColors = [
        0xffffff, // White core
        0xffff99, // Bright yellow
        0xff9933, // Orange
        0xff6666, // Red
        0x996633  // Brown smoke
    ];
    
    // Create multiple concentric rings
    const numRings = 4;
    const explosionDuration = 800; // 0.8 seconds
    
    for (let ringIndex = 0; ringIndex < numRings; ringIndex++) {
        // Create graphics object for this ring
        const ringGraphics = scene.add.graphics();
        
        // Calculate ring properties
        const ringDelay = ringIndex * 80; // Stagger ring appearances
        const ringColor = ringColors[ringIndex % ringColors.length];
        const finalRadius = radius * (1 - ringIndex * 0.15); // Smaller rings for inner ones
        
        // Position the ring at explosion center
        ringGraphics.x = x;
        ringGraphics.y = y;
        
        // Start ring animation after delay
        scene.time.delayedCall(ringDelay, () => {
            // Animate the ring expanding and fading
            scene.tweens.add({
                targets: ringGraphics,
                scaleX: { from: 0.1, to: 2.0 },
                scaleY: { from: 0.1, to: 2.0 },
                alpha: { from: 0.9, to: 0.0 },
                duration: explosionDuration - ringDelay,
                ease: 'Power2',
                onUpdate: (tween) => {
                    // Redraw the ring with current scale and alpha
                    const progress = tween.progress;
                    const currentRadius = finalRadius * progress;
                    const currentAlpha = ringGraphics.alpha;
                    const lineWidth = Math.max(1, 6 - progress * 4); // Thicker lines at start
                    
                    ringGraphics.clear();
                    ringGraphics.lineStyle(lineWidth, ringColor, currentAlpha);
                    ringGraphics.strokeCircle(0, 0, currentRadius);
                    
                    // Add some fill for the inner rings
                    if (ringIndex < 2) {
                        const fillAlpha = currentAlpha * 0.3;
                        ringGraphics.fillStyle(ringColor, fillAlpha);
                        ringGraphics.fillCircle(0, 0, currentRadius);
                    }
                },
                onComplete: () => {
                    ringGraphics.destroy();
                }
            });
        });
    }
    
    // Add screen shake effect for impact
    if (scene.cameras && scene.cameras.main) {
        // Reduce shake intensity for terrain hits
        const baseShakeIntensity = Math.min(0.02, radius / 1000); // Scale shake with explosion size
        const shakeIntensity = hitType === 'terrain' ? baseShakeIntensity * 0.5 : baseShakeIntensity;
        scene.cameras.main.shake(200, shakeIntensity);
    }
    
    // Add initial flash effect
    const flashGraphics = scene.add.graphics();
    flashGraphics.x = x;
    flashGraphics.y = y;
    flashGraphics.fillStyle(0xffffff, 0.8);
    flashGraphics.fillCircle(0, 0, radius * 0.3);
    
    // Flash fade out quickly
    scene.tweens.add({
        targets: flashGraphics,
        alpha: { from: 0.8, to: 0 },
        scaleX: { from: 1, to: 1.5 },
        scaleY: { from: 1, to: 1.5 },
        duration: 150,
        ease: 'Power3',
        onComplete: () => flashGraphics.destroy()
    });
    
    // Add radiating sparks
    const numSparks = 8;
    for (let i = 0; i < numSparks; i++) {
        const sparkGraphics = scene.add.graphics();
        const sparkAngle = (Math.PI * 2 * i) / numSparks + (Math.random() - 0.5) * 0.4;
        const sparkDistance = radius + Math.random() * radius;
        
        sparkGraphics.x = x;
        sparkGraphics.y = y;
        
        // Draw small spark
        sparkGraphics.fillStyle(0xffffff, 0.9);
        sparkGraphics.fillCircle(0, 0, 2);
        
        // Animate spark flying outward
        scene.tweens.add({
            targets: sparkGraphics,
            x: x + Math.cos(sparkAngle) * sparkDistance,
            y: y + Math.sin(sparkAngle) * sparkDistance,
            alpha: { from: 0.9, to: 0 },
            duration: 400 + Math.random() * 200,
            ease: 'Power2',
            onComplete: () => sparkGraphics.destroy()
        });
    }
    
    return null;
}

/**
 * Calculate area-of-effect damage for turrets within explosion radius
 * @param {number} explosionX - X coordinate of explosion center
 * @param {number} explosionY - Y coordinate of explosion center
 * @param {number} explosionRadius - Radius of the explosion
 * @param {Array<any>} turrets - Array of turret objects
 * @returns {Array<{turret: any, damage: number, distance: number}>} Array of affected turrets and damage info
 */
export function calculateAOEDamage(explosionX, explosionY, explosionRadius, turrets) {
    const affectedTurrets = [];
    
    console.log(`🔍 AOE Check: Explosion at (${explosionX.toFixed(1)}, ${explosionY.toFixed(1)}) with radius ${explosionRadius}px`);
    console.log(`🔍 Checking ${turrets.length} turrets for AOE damage:`);
    
    turrets.forEach((turret, index) => {
        const distance = Phaser.Math.Distance.Between(explosionX, explosionY, turret.x, turret.y);
        console.log(`  Turret ${index + 1} (${turret.team}): at (${turret.x.toFixed(1)}, ${turret.y.toFixed(1)}) - Distance: ${distance.toFixed(1)}px`);
        
        // Check if turret is within explosion radius
        if (distance <= explosionRadius) {
            // Calculate AOE damage based on distance from explosion center
            // Damage falls off from center to edge of explosion
            const maxAOEDamage = 15; // Maximum AOE damage (less than direct hit)
            const minAOEDamage = 3;  // Minimum AOE damage at explosion edge
            
            // Linear falloff from center to edge
            const distanceFactor = 1 - (distance / explosionRadius);
            const aoeDamage = minAOEDamage + (maxAOEDamage - minAOEDamage) * distanceFactor;
            
            console.log(`    ✅ WITHIN RANGE! AOE damage to ${turret.team}: ${Math.round(aoeDamage)} (distance: ${distance.toFixed(1)}px from ${explosionRadius}px explosion)`);
            
            affectedTurrets.push({
                turret: turret,
                damage: Math.round(aoeDamage),
                distance: distance
            });
        } else {
            console.log(`    ❌ Too far away (${distance.toFixed(1)}px > ${explosionRadius}px)`);
        }
    });
    
    console.log(`🎯 AOE Result: ${affectedTurrets.length} turrets affected by explosion`);
    return affectedTurrets;
}

/**
 * Check if projectile collides with terrain, turrets, or world bounds
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Phaser.GameObjects.Graphics} projectile - The projectile object
 * @param {{points: Array<{x: number, y: number}>, flatBases: Array}} landscapeData - Landscape collision data
 * @param {Array<any>} turrets - Array of turret objects to check collision against
 * @returns {{terrain: boolean, turret: any|null, turretDistance?: number, worldBounds: boolean}} Collision results
 */
export function checkProjectileCollisions(scene, projectile, landscapeData, turrets) {
    const collisions = {
        terrain: false,
        turret: null,
        worldBounds: false
    };

    // Check world bounds (allow projectiles to fly above the top of the world)
    const worldBounds = scene.physics.world.bounds;
    if (projectile.x < 0 || projectile.x > worldBounds.width || 
        projectile.y > worldBounds.height) {
        collisions.worldBounds = true;
        return collisions;
    }

    // Check turret collisions
    turrets.forEach(turret => {
        const distance = Phaser.Math.Distance.Between(projectile.x, projectile.y, turret.x, turret.y);
        if (distance < 25) { // Turret collision radius
            collisions.turret = turret;
            collisions.turretDistance = distance; // Store distance for damage calculation
        }
    });

    // Improved terrain collision check using landscape points
    if (landscapeData && landscapeData.points) {
        const points = landscapeData.points;
        const projectileX = projectile.x;
        const projectileY = projectile.y;
        
        // Find the two closest landscape points to interpolate between
        let leftPoint = null;
        let rightPoint = null;
        
        for (let i = 0; i < points.length - 1; i++) {
            if (points[i].x <= projectileX && points[i + 1].x >= projectileX) {
                leftPoint = points[i];
                rightPoint = points[i + 1];
                break;
            }
        }
        
        if (leftPoint && rightPoint) {
            // Linear interpolation to find ground height at projectile X position
            const t = (projectileX - leftPoint.x) / (rightPoint.x - leftPoint.x);
            const groundY = leftPoint.y + t * (rightPoint.y - leftPoint.y);
            
            // Check if projectile is below ground level (with small tolerance)
            if (projectileY >= groundY - 3) {
                collisions.terrain = true;
            }
        } else {
            // Fallback to simple ground level check if points not found
            const fallbackGroundLevel = worldBounds.height - 100;
            if (projectileY > fallbackGroundLevel) {
                collisions.terrain = true;
            }
        }
    }
    
    return collisions;
}

/**
 * Clean up projectile and its associated graphics objects
 * @param {Phaser.GameObjects.Graphics & {trail?: Array, trailGraphics?: Phaser.GameObjects.Graphics, body?: Phaser.Physics.Arcade.Body}} projectile - The projectile to clean up
 * @returns {void}
 */
export function cleanupProjectile(projectile) {
    if (projectile.trailGraphics) {
        projectile.trailGraphics.destroy();
    }
    if (projectile.body) {
        projectile.body.destroy();
    }
    projectile.destroy();
}

/**
 * Calculate damage based on impact accuracy and projectile velocity
 * @param {Phaser.GameObjects.Graphics} projectile - The projectile object
 * @param {any} turret - The turret that was hit
 * @param {number} distance - Distance from projectile to turret center
 * @returns {number} Calculated damage amount (0-50)
 */
export function calculateDamage(projectile, turret, distance) {
    // Base damage parameters - more generous ranges
    const MAX_DAMAGE = 50; // Maximum possible damage
    const BASE_DAMAGE = 20; // Higher minimum damage for any hit
    const TURRET_RADIUS = 25; // Turret collision radius
    
    // Calculate accuracy factor with more generous curve
    // Use square root to make the falloff less harsh
    const rawAccuracyFactor = Math.max(0, 1 - (distance / TURRET_RADIUS));
    const accuracyFactor = Math.sqrt(rawAccuracyFactor); // More generous curve
    
    // Calculate velocity factor from projectile speed - more generous scaling
    const velocityFactor = calculateVelocityFactor(projectile);
    
    // Adjust weighting to be more balanced: 60% accuracy, 40% velocity
    const accuracyWeight = 0.6;
    const velocityWeight = 0.4;
    const combinedFactor = (accuracyWeight * accuracyFactor) + (velocityWeight * velocityFactor);
    
    // Calculate final damage
    const damage = BASE_DAMAGE + (MAX_DAMAGE - BASE_DAMAGE) * combinedFactor;
    
    console.log(`🎯 Damage calculation (generous):
    - Distance: ${distance.toFixed(1)}px from turret center (${TURRET_RADIUS}px radius)
    - Raw accuracy: ${(rawAccuracyFactor * 100).toFixed(1)}% → Curved: ${(accuracyFactor * 100).toFixed(1)}%
    - Velocity factor: ${(velocityFactor * 100).toFixed(1)}% (faster = more damage)
    - Combined factor: ${(combinedFactor * 100).toFixed(1)}% (60% accuracy + 40% velocity)
    - Final damage: ${Math.round(damage)} (range: ${BASE_DAMAGE}-${MAX_DAMAGE})`);
    
    return Math.round(damage);
}

/**
 * Calculate velocity factor from projectile speed
 * @param {Phaser.GameObjects.Graphics} projectile - The projectile object
 * @returns {number} Velocity factor (0.0-1.0)
 */
export function calculateVelocityFactor(projectile) {
    let velocityFactor = 0;
    if (projectile.body && projectile.body.velocity) {
        const speed = Math.sqrt(
            projectile.body.velocity.x ** 2 + 
            projectile.body.velocity.y ** 2
        );
        // More generous velocity scaling: 0-1500 px/s -> 0.0-1.0 factor
        velocityFactor = Math.min(1.0, speed / 1500);
    }
    return velocityFactor;
}

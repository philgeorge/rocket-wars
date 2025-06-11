// projectile.js
// Projectile physics and graphics for Rocket Wars

/**
 * Create a projectile with physics and visual trail
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {number} angle - Launch angle in radians
 * @param {number} power - Launch power (0.2 to 1.0)
 * @returns {Phaser.GameObjects.Graphics & {trail: Array<{x: number, y: number, time: number}>, maxTrailLength: number, isProjectile: boolean, startTime: number, maxFlightTime: number, trailGraphics?: Phaser.GameObjects.Graphics}}
 */
export function createProjectile(scene, startX, startY, angle, power) {
    // Create projectile graphics (small rocket/bullet)
    const projectile = /** @type {Phaser.GameObjects.Graphics & {trail: Array<{x: number, y: number, time: number}>, maxTrailLength: number, isProjectile: boolean, startTime: number, maxFlightTime: number, trailGraphics?: Phaser.GameObjects.Graphics}} */ (scene.add.graphics());
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
 * Create explosion effect with debris
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} x - Explosion X coordinate
 * @param {number} y - Explosion Y coordinate
 * @param {number} [radius=20] - Explosion radius
 * @returns {null}
 */
export function createExplosion(scene, x, y, radius = 20) {
    // Define colors for debris
    const colors = [0xff6b6b, 0xff9f43, 0xffc048, 0xfff3a0];
    
    // Create debris that stays at impact point initially, then spreads outward
    const debrisObjects = [];
    
    for (let i = 0; i < 8; i++) {
        // Create debris as simple graphics object
        const debris = /** @type {Phaser.GameObjects.Graphics & {startX: number, startY: number, moveAngle: number, maxDistance: number, lifeTime: number, maxLife: number}} */ (scene.add.graphics());
        debris.fillStyle(colors[i % colors.length], 0.9);
        debris.fillRect(-2, -2, 4, 4); // Small square debris
        
        // Position debris exactly at explosion center
        debris.x = x;
        debris.y = y;
        
        // Calculate direction for spreading (but don't move yet)
        const baseAngle = (Math.PI * 2 * i) / 8;
        const angleVariation = (Math.random() - 0.5) * 0.3;
        const debrisAngle = baseAngle + angleVariation;
        
        // Store movement data on debris object
        debris.startX = x; // Remember starting position
        debris.startY = y;
        debris.moveAngle = debrisAngle;
        debris.maxDistance = 20 + Math.random() * 30; // How far debris will travel
        debris.lifeTime = 0;
        debris.maxLife = 90; // 1.5 seconds at 60fps
        
        debrisObjects.push(debris);
    }
    
    // Manual animation loop for debris
    const debrisTimer = scene.time.addEvent({
        delay: 16, // ~60fps
        repeat: 90, // 1.5 seconds
        callback: () => {
            debrisObjects.forEach((debris, index) => {
                if (!debris.active) return;
                
                debris.lifeTime++;
                const progress = debris.lifeTime / debris.maxLife;
                
                // Calculate current position based on how much time has passed
                // Debris spreads outward over time with gravity effect
                const distance = debris.maxDistance * progress;
                const gravityDrop = progress * progress * 15; // Quadratic gravity effect
                
                debris.x = debris.startX + Math.cos(debris.moveAngle) * distance;
                debris.y = debris.startY + Math.sin(debris.moveAngle) * distance + gravityDrop;
                
                // Fade out over time
                debris.alpha = 1 - progress;
                
                // Destroy when life is over
                if (debris.lifeTime >= debris.maxLife) {
                    debris.destroy();
                }
            });
        }
    });
    
    // Return null since we removed the explosion graphics
    return null;
}

/**
 * Check if projectile collides with terrain, turrets, or world bounds
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Phaser.GameObjects.Graphics} projectile - The projectile object
 * @param {{points: Array<{x: number, y: number}>, flatBases: Array}} landscapeData - Landscape collision data
 * @param {Array<any>} turrets - Array of turret objects to check collision against
 * @returns {{terrain: boolean, turret: any|null, worldBounds: boolean}} Collision results
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

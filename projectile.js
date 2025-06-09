// projectile.js
// Projectile physics and graphics for Rocket Wars

export function createProjectile(scene, startX, startY, angle, power) {
    // Create projectile graphics (small rocket/bullet)
    const projectile = scene.add.graphics();
    projectile.fillStyle(0xff6b6b, 1); // Reddish color for projectile
    projectile.fillCircle(0, 0, 3); // 3px radius circle
    projectile.lineStyle(1, 0xff4444, 1);
    projectile.strokeCircle(0, 0, 3);
    
    // Position at start location
    projectile.x = startX;
    projectile.y = startY;
    
    // Enable physics on the projectile
    scene.physics.add.existing(projectile);
    projectile.body.setCircle(3); // Set physics body to match visual circle
    
    // Calculate initial velocity based on angle and power
    // Power ranges from 0.2 to 1.0, let's scale it to reasonable velocity
    const baseVelocity = 300; // Base velocity (pixels per second)
    const maxVelocity = 800; // Maximum velocity at full power
    const velocity = baseVelocity + (maxVelocity - baseVelocity) * power;
    
    // Convert angle and power to velocity components
    const velocityX = Math.cos(angle) * velocity;
    const velocityY = Math.sin(angle) * velocity;
    
    // Set initial velocity
    projectile.body.setVelocity(velocityX, velocityY);
    
    // Add some bounce (optional - projectiles can bounce off terrain)
    projectile.body.setBounce(0.3, 0.3);
    
    // Add trail effect
    projectile.trail = [];
    projectile.maxTrailLength = 15;
    
    // Store projectile data
    projectile.isProjectile = true;
    projectile.startTime = scene.time.now;
    projectile.maxFlightTime = 10000; // 10 seconds max flight time
    
    return projectile;
}

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

export function createExplosion(scene, x, y, radius = 20) {
    // Create explosion visual effect
    const explosion = scene.add.graphics();
    
    // Multiple concentric circles for explosion effect
    const colors = [0xff6b6b, 0xff9f43, 0xffc048, 0xfff3a0];
    const sizes = [radius, radius * 0.7, radius * 0.4, radius * 0.2];
    
    colors.forEach((color, index) => {
        explosion.fillStyle(color, 0.8 - index * 0.2); // Decreasing alpha
        explosion.fillCircle(x, y, sizes[index]);
    });
    
    // Create simple debris manually (more reliable than particle system)
    for (let i = 0; i < 8; i++) {
        const debris = scene.add.graphics();
        debris.fillStyle(colors[i % colors.length], 0.8);
        debris.fillCircle(0, 0, 2);
        debris.x = x;
        debris.y = y;
        
        // Random velocity for debris
        const debrisAngle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
        const debrisSpeed = 50 + Math.random() * 100;
        
        // Animate debris
        scene.tweens.add({
            targets: debris,
            x: x + Math.cos(debrisAngle) * debrisSpeed,
            y: y + Math.sin(debrisAngle) * debrisSpeed,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => debris.destroy()
        });
    }
    
    // Animate explosion shrinking and fading
    scene.tweens.add({
        targets: explosion,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => explosion.destroy()
    });
    
    return explosion;
}

export function checkProjectileCollisions(scene, projectile, landscapeData, turrets) {
    const collisions = {
        terrain: false,
        turret: null,
        worldBounds: false
    };
    
    // Check world bounds
    const worldBounds = scene.physics.world.bounds;
    if (projectile.x < 0 || projectile.x > worldBounds.width || 
        projectile.y < 0 || projectile.y > worldBounds.height) {
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

export function cleanupProjectile(projectile) {
    if (projectile.trailGraphics) {
        projectile.trailGraphics.destroy();
    }
    if (projectile.body) {
        projectile.body.destroy();
    }
    projectile.destroy();
}

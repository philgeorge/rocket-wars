// chunkedLandscape.js
// Chunked terrain system for destructible landscape in Rocket Wars

import { generateLandscapePoints } from './landscape.js';
import { loadDebugSetting } from './debugSettings.js';
import { applyDamage } from './turnManager.js';
import { info, trace, warn } from './logger.js';

/**
 * @typedef {Object} TerrainChunk
 * @property {number} x - X position of chunk
 * @property {number} y - Y position (top of chunk)
 * @property {number} width - Width of chunk
 * @property {number} height - Height of chunk
 * @property {boolean} destroyed - Whether chunk is destroyed
 * @property {boolean} animating - Whether chunk is currently animating damage
 * @property {number} startY - Starting Y position for animation
 * @property {number} startHeight - Starting height for animation
 * @property {number} targetY - Target Y position for animation
 * @property {number} targetHeight - Target height for animation
 * @property {number} animationStartTime - When the animation started
 * @property {Phaser.GameObjects.Graphics} graphics - Visual representation
 */

/**
 * Convert existing landscape points into terrain chunks
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Array<{x: number, y: number}>} points - Landscape points
 * @param {number} worldWidth - World width in pixels
 * @param {number} worldHeight - World height in pixels
 * @param {number} [chunkWidth=30] - Width of each chunk in pixels (aligned with landscape points)
 * @returns {{chunks: TerrainChunk[], graphics: Phaser.GameObjects.Graphics}} Chunk data and graphics
 */
export function createChunkedLandscape(scene, points, worldWidth, worldHeight, chunkWidth = 40) {
    info('🏔️ Converting landscape points to chunks...');
    
    const chunks = [];
    const numChunks = Math.floor(worldWidth / chunkWidth);
    const actualChunkWidth = worldWidth / numChunks; // Adjust for perfect fit
    
    // Create graphics object for drawing chunks
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x3a5c2c, 1); // Same green as original landscape
    
    trace(`Creating ${numChunks} chunks, each ${actualChunkWidth}px wide (aligned with landscape points)`);
    
    // Convert points to chunks - now with 1:1 alignment!
    for (let i = 0; i < numChunks && i < points.length; i++) {
        const chunkX = i * actualChunkWidth;
        
        // Direct alignment: use landscape point height directly (no interpolation needed!)
        const terrainY = points[i].y;
        
        // Create chunk that extends from terrain surface down to bottom of world
        const chunk = {
            x: chunkX,
            y: terrainY,
            width: actualChunkWidth,
            height: worldHeight - terrainY,
            destroyed: false,
            animating: false,
            startY: terrainY,
            startHeight: worldHeight - terrainY,
            targetY: terrainY,
            targetHeight: worldHeight - terrainY,
            animationStartTime: 0,
            graphics: null // Will be set when drawing
        };
        
        chunks.push(chunk);
    }
    
    // Draw all chunks
    drawChunkedLandscape(graphics, chunks);
    
    info(`📊 Created ${chunks.length} terrain chunks`);
    
    return { chunks, graphics };
}

/**
 * Draw the chunked landscape with smooth edge transitions
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to draw with
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 */
export function drawChunkedLandscape(graphics, chunks) {
    graphics.clear();
    
    // Set fill style for green terrain chunks
    graphics.fillStyle(0x3a5c2c, 1); // Same green as original landscape
    
    if (chunks.length === 0) return;
    
    // Calculate world dimensions from chunks
    const worldWidth = chunks.length > 0 ? chunks[chunks.length - 1].x + chunks[chunks.length - 1].width : 1000;
    const worldHeight = chunks.length > 0 ? chunks[0].height + chunks[0].y : 800; // Approximate from first chunk
    
    // Create smooth terrain shape
    graphics.beginPath();
    graphics.moveTo(0, worldHeight); // Start at bottom-left
    
    // Build array of chunk top points for smoothing
    const topPoints = [];
    chunks.forEach(chunk => {
        if (!chunk.destroyed) {
            topPoints.push({
                x: chunk.x + chunk.width / 2, // Center of chunk
                y: chunk.y
            });
        }
    });
    
    if (topPoints.length === 0) {
        // No chunks left, draw empty
        graphics.closePath();
        graphics.fillPath();
        return;
    }
    
    // Draw smooth interpolated line through chunk tops
    graphics.lineTo(topPoints[0].x, topPoints[0].y);
    
    // Create smooth transitions by adding interpolated points
    for (let i = 1; i < topPoints.length; i++) {
        const prev = topPoints[i - 1];
        const curr = topPoints[i];
        
        // Add intermediate points for smoother curves
        const steps = 3; // Number of interpolation steps
        for (let step = 1; step <= steps; step++) {
            const t = step / (steps + 1);
            
            // Simple interpolation with slight curve
            const interpX = prev.x + (curr.x - prev.x) * t;
            const interpY = prev.y + (curr.y - prev.y) * t;
            
            // Add slight curve by adjusting Y slightly
            const midPointAdjustment = Math.sin(t * Math.PI) * 2; // Small curve adjustment
            const adjustedY = interpY - midPointAdjustment;
            
            graphics.lineTo(interpX, adjustedY);
        }
        
        // Finally draw to the actual chunk top
        graphics.lineTo(curr.x, curr.y);
    }
    
    // Complete the shape by going to bottom-right and back to start
    const lastPoint = topPoints[topPoints.length - 1];
    
    graphics.lineTo(worldWidth, lastPoint.y);
    graphics.lineTo(worldWidth, worldHeight);
    graphics.lineTo(0, worldHeight);
    graphics.closePath();
    graphics.fillPath();
    
    // DEBUG: Draw chunk boundaries and smoothed line for visibility (conditional)
    const landscapeChunkOutlines = loadDebugSetting('landscapeChunkOutlines', false);
    if (landscapeChunkOutlines) {
        graphics.lineStyle(2, 0xff0000, 0.7); // Red lines for chunk boundaries
        chunks.forEach(chunk => {
            if (!chunk.destroyed) {
                // Draw chunk boundary rectangle
                graphics.strokeRect(chunk.x, chunk.y, chunk.width, chunk.height);
                
                // Draw a small marker at the chunk top center
                const centerX = chunk.x + chunk.width / 2;
                graphics.fillStyle(0xff0000, 1);
                graphics.fillCircle(centerX, chunk.y, 3);
            }
        });
        
        // Draw the smoothed line in bright blue for visibility
        if (topPoints.length > 1) {
            graphics.lineStyle(3, 0x00ffff, 0.9); // Bright cyan line
            graphics.beginPath();
            graphics.moveTo(topPoints[0].x, topPoints[0].y);
            
            for (let i = 1; i < topPoints.length; i++) {
                const prev = topPoints[i - 1];
                const curr = topPoints[i];
                
                // Add intermediate points for smoother curves
                const steps = 3;
                for (let step = 1; step <= steps; step++) {
                    const t = step / (steps + 1);
                    const interpX = prev.x + (curr.x - prev.x) * t;
                    const interpY = prev.y + (curr.y - prev.y) * t;
                    const midPointAdjustment = Math.sin(t * Math.PI) * 2;
                    const adjustedY = interpY - midPointAdjustment;
                    graphics.lineTo(interpX, adjustedY);
                }
                graphics.lineTo(curr.x, curr.y);
            }
            graphics.strokePath();
        }
        
        // Reset fill style for future drawing
        graphics.fillStyle(0x3a5c2c, 1);
    }
}

/**
 * Calculate landscape support percentage for a turret based on chunks beneath it
 * @param {any} turret - The turret object
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 * @returns {number} Percentage of turret width that has landscape support (0-100)
 */
function calculateTurretSupport(turret, chunks) {
    const turretWidth = 40; // Turret width in pixels
    const turretLeft = turret.x - (turretWidth / 2);
    const turretRight = turret.x + (turretWidth / 2);
    const turretBottom = turret.y + 25; // Turret sits 25px above base
    
    trace(`🔍 Calculating support for turret at (${turret.x.toFixed(1)}, ${turret.y.toFixed(1)}) - team ${turret.team}`);
    trace(`🔍 Turret spans from x=${turretLeft.toFixed(1)} to x=${turretRight.toFixed(1)}, bottom at y=${turretBottom.toFixed(1)}`);
    
    let supportedWidth = 0;
    const samplePoints = 8; // Sample support every 5px across turret width
    
    for (let i = 0; i < samplePoints; i++) {
        const sampleX = turretLeft + (i / (samplePoints - 1)) * turretWidth;
        let hasSupport = false;
        
        // Check if any chunk provides support at this X position
        for (const chunk of chunks) {
            if (chunk.destroyed) continue;
            
            // Check if this chunk is at the right X position and extends up to support the turret
            const chunkLeft = chunk.x;
            const chunkRight = chunk.x + chunk.width;
            const chunkTop = chunk.y;
            
            if (sampleX >= chunkLeft && sampleX <= chunkRight && chunkTop <= turretBottom + 5) {
                hasSupport = true;
                break;
            }
        }
        
        if (hasSupport) {
            supportedWidth += turretWidth / samplePoints;
        }
    }
    
    const supportPercentage = (supportedWidth / turretWidth) * 100;
    trace(`🔍 Turret support: ${supportedWidth.toFixed(1)}px of ${turretWidth}px supported (${supportPercentage.toFixed(1)}%)`);
    return supportPercentage;
}

/**
 * Find the new landing position for a falling turret
 * @param {any} turret - The turret object
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 * @returns {number|null} New Y position for turret, or null if no valid landing spot
 */
function findTurretLandingPosition(turret, chunks) {
    const turretWidth = 40;
    const turretLeft = turret.x - (turretWidth / 2);
    const turretRight = turret.x + (turretWidth / 2);
    
    trace(`🔍 Finding landing position for turret at x=${turret.x.toFixed(1)} (spans ${turretLeft.toFixed(1)} to ${turretRight.toFixed(1)})`);
    
    // Find the highest terrain level that can support at least 50% of the turret
    let bestLandingY = null;
    let bestSupportPercentage = 0;
    
    // Create a list of potential landing levels from existing chunk tops
    const potentialLevels = new Set();
    for (const chunk of chunks) {
        if (!chunk.destroyed && chunk.height > 10) {
            potentialLevels.add(chunk.y);
        }
    }
    
    // Sort levels from highest (lowest Y value) to lowest
    const sortedLevels = Array.from(potentialLevels).sort((a, b) => a - b);
    
    for (const level of sortedLevels) {
        // Calculate support at this level
        let supportedWidth = 0;
        const samplePoints = 8;
        
        for (let i = 0; i < samplePoints; i++) {
            const sampleX = turretLeft + (i / (samplePoints - 1)) * turretWidth;
            
            // Check if any chunk provides support at this X position and level
            for (const chunk of chunks) {
                if (chunk.destroyed) continue;
                
                const chunkLeft = chunk.x;
                const chunkRight = chunk.x + chunk.width;
                const chunkTop = chunk.y;
                
                if (sampleX >= chunkLeft && sampleX <= chunkRight && 
                    chunkTop <= level + 5 && (chunkTop + chunk.height) >= level) {
                    supportedWidth += turretWidth / samplePoints;
                    break;
                }
            }
        }
        
        const supportPercentage = (supportedWidth / turretWidth) * 100;
        
        if (supportPercentage >= 50 && supportPercentage > bestSupportPercentage) {
            bestLandingY = level - 25; // Position turret 25px above surface
            bestSupportPercentage = supportPercentage;
            trace(`✅ New best landing position: y=${bestLandingY.toFixed(1)} with ${supportPercentage.toFixed(1)}% support`);
        }
    }
    
    return bestLandingY;
}

/**
 * Animate turret falling to new position
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {any} turret - The turret object
 * @param {number} targetY - Target Y position
 * @param {any} gameState - Current game state
 */
function animateTurretFalling(scene, turret, targetY, gameState) {
    info(`🪂 Animating turret fall from y=${turret.y.toFixed(1)} to y=${targetY.toFixed(1)}`);
    
    // Apply 10 points of falling damage
    const FALL_DAMAGE = 10;
    applyDamage(gameState, turret.team, FALL_DAMAGE);
    info(`💥 Turret ${turret.team} took ${FALL_DAMAGE} falling damage, health now: ${gameState[turret.team].health}%`);
    
    // Update turret visual health indicator
    if (turret.updateHealthDisplay) {
        turret.updateHealthDisplay(gameState[turret.team].health);
    }
    
    // Animate the turret falling with gravity-like easing
    scene.tweens.add({
        targets: turret,
        y: targetY,
        duration: 800, // 0.8 seconds for falling animation
        ease: 'Bounce.easeOut', // Bouncy landing effect
        onComplete: () => {
            info(`🎯 Turret ${turret.team} landed at y=${turret.y.toFixed(1)}`);
            
            // Check if the turret/player is still alive after falling damage
            if (gameState[turret.team].health <= 0) {
                warn(`💀 Turret ${turret.team} was destroyed by falling damage!`);
                // Note: Player elimination will be handled by the existing game systems
                // when the main game loop checks for dead players
            }
        }
    });
}

/**
 * Check all turrets for loss of landscape support and handle falling
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 * @param {any[]} turrets - Array of turrets to check
 * @param {any} gameState - Current game state
 * @returns {boolean} True if any turrets took falling damage
 */
export function handleTurretFalling(scene, chunks, turrets, gameState) {
    info(`🔍 Checking ${turrets.length} turrets for landscape support after terrain destruction...`);
    
    let anyTurretFell = false;
    
    turrets.forEach(turret => {
        const supportPercentage = calculateTurretSupport(turret, chunks);
        
        if (supportPercentage < 50) {
            warn(`⚠️ Turret ${turret.team} has insufficient support (${supportPercentage.toFixed(1)}% < 50%) - initiating fall`);
            
            const newPosition = findTurretLandingPosition(turret, chunks);
            
            if (newPosition !== null && newPosition > turret.y) {
                info(`🪂 Turret ${turret.team} will fall to new position y=${newPosition.toFixed(1)}`);
                animateTurretFalling(scene, turret, newPosition, gameState);
                anyTurretFell = true;
            } else if (newPosition === null) {
                warn(`💀 Turret ${turret.team} has no valid landing position - would be destroyed`);
                // Could implement turret destruction here if needed
            } else {
                trace(`🚫 Turret ${turret.team} cannot fall upward - staying at current position`);
            }
        } else {
            trace(`✅ Turret ${turret.team} has sufficient support (${supportPercentage.toFixed(1)}% >= 50%)`);
        }
    });
    
    return anyTurretFell;
}

/**
 * Create explosion damage to terrain chunks with animated reduction
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object for redrawing
 * @param {number} impactX - X coordinate of projectile impact
 * @param {number} impactY - Y coordinate of projectile impact
 */
export function createTerrainDestruction(scene, chunks, graphics, impactX, impactY) {
    info(`💥 Creating terrain destruction at impact point (${impactX}, ${impactY})`);
    
    let chunksAffected = 0;
    
    // Find the chunk that contains the impact point (based on X coordinate)
    trace(`🔍 Finding chunk containing impact point (${impactX}, ${impactY})...`);
    
    let closestChunk = null;
    let closestDistance = Infinity;
    let closestChunkIndex = -1;
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk.destroyed) continue;
        
        // Check if impact point is within this chunk's X bounds, or very close to the edges
        const chunkLeft = chunk.x;
        const chunkRight = chunk.x + chunk.width;
        const tolerance = 5; // Allow 5 pixels tolerance on X boundaries
        const withinX = impactX >= (chunkLeft - tolerance) && impactX <= (chunkRight + tolerance);
        
        // Debug the first few chunks and chunks around the impact area
        if (i < 3 || (impactX >= chunk.x - 50 && impactX <= chunk.x + chunk.width + 50)) {
            trace(`🔍 Chunk ${i}: pos(${chunk.x.toFixed(1)}, ${chunk.y.toFixed(1)}), size(${chunk.width.toFixed(1)}x${chunk.height.toFixed(1)}), withinX: ${withinX}`);
        }
        
        // For chunks with matching X coordinate, calculate distance to impact point
        if (withinX) {
            // Calculate distance from impact point to closest point on chunk
            const chunkCenterX = chunk.x + chunk.width / 2;
            const chunkCenterY = chunk.y + chunk.height / 2;
            
            // Find closest point on chunk to impact point
            const closestX = Math.max(chunk.x, Math.min(impactX, chunk.x + chunk.width));
            const closestY = Math.max(chunk.y, Math.min(impactY, chunk.y + chunk.height));
            
            const distanceToChunk = Math.sqrt((impactX - closestX) ** 2 + (impactY - closestY) ** 2);
            
            trace(`   → X matches! Center(${chunkCenterX.toFixed(1)}, ${chunkCenterY.toFixed(1)}), closest point(${closestX.toFixed(1)}, ${closestY.toFixed(1)}), distance: ${distanceToChunk.toFixed(1)}`);
            
            // Keep track of the closest chunk
            if (distanceToChunk < closestDistance) {
                closestDistance = distanceToChunk;
                closestChunk = chunk;
                closestChunkIndex = i;
            }
        }
    }
    
    // Damage the closest chunk if we found one
    if (closestChunk) {
        info(`🎯 Selected closest chunk at index ${closestChunkIndex}: pos(${closestChunk.x.toFixed(1)}, ${closestChunk.y.toFixed(1)}), distance: ${closestDistance.toFixed(1)}`);
        
        chunksAffected++;
        
        // Set up animated damage reduction
        const squareBlockDamage = closestChunk.width; // Remove full chunk width in height
        const newHeight = Math.max(0, closestChunk.height - squareBlockDamage);
        const heightReduction = closestChunk.height - newHeight;
        const newY = closestChunk.y + heightReduction; // Move top down as height decreases
        
        // Start animation
        closestChunk.animating = true;
        closestChunk.startY = closestChunk.y;
        closestChunk.startHeight = closestChunk.height;
        closestChunk.targetY = newY;
        closestChunk.targetHeight = newHeight;
        closestChunk.animationStartTime = scene.time.now;
        
        trace(`� Starting animated damage for chunk at x=${closestChunk.x.toFixed(1)}: will remove ${heightReduction.toFixed(1)}px over 1 second (${newHeight.toFixed(1)}px will remain)`);
        
        // Check if chunk will be destroyed after animation
        if (newHeight <= 15) {
            warn(`💀 Chunk at x=${closestChunk.x.toFixed(1)} will be destroyed after animation (too small)`);
        }
    } else {
        warn(`⚠️ No chunk found with matching X coordinate for impact at (${impactX.toFixed(1)}, ${impactY.toFixed(1)})`);
    }
    
    info(`🏔️ Destruction setup complete: ${chunksAffected} chunks will be animated`);
}

/**
 * Update animations for damaged chunks
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object for redrawing
 */
export function updateChunkAnimations(scene, chunks, graphics) {
    let anyChunkAnimating = false;
    const animationDuration = 500; // 0.5 seconds in milliseconds
    
    chunks.forEach(chunk => {
        if (!chunk.animating) return;
        
        anyChunkAnimating = true;
        
        // Calculate animation progress (0 to 1)
        const elapsed = scene.time.now - chunk.animationStartTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Use easing function for smoother animation (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate between start and target values
        chunk.y = chunk.startY + (chunk.targetY - chunk.startY) * easedProgress;
        chunk.height = chunk.startHeight + (chunk.targetHeight - chunk.startHeight) * easedProgress;
        
        // Check if animation is complete
        if (progress >= 1) {
            chunk.animating = false;
            chunk.y = chunk.targetY;
            chunk.height = chunk.targetHeight;
            
            // Destroy chunk if it's too small
            if (chunk.height <= 15) {
                chunk.destroyed = true;
                info(`💀 Chunk at x=${chunk.x.toFixed(1)} destroyed after animation (too small)`);
            }
            
            trace(`✅ Animation complete for chunk at x=${chunk.x.toFixed(1)}`);
        }
    });
    
    // Redraw if any chunks are animating
    if (anyChunkAnimating) {
        drawChunkedLandscape(graphics, chunks);
    }
    
    return anyChunkAnimating;
}

/**
 * Check if projectile collides with chunked terrain
 * @param {Phaser.GameObjects.Graphics} projectile - The projectile
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 * @returns {boolean} True if collision detected
 */
export function checkChunkedTerrainCollision(projectile, chunks) {
    const projectileX = projectile.x;
    const projectileY = projectile.y;
    const projectileRadius = 3; // Same as projectile radius
    
    for (const chunk of chunks) {
        if (chunk.destroyed) continue;
        
        // Simple AABB collision check with projectile circle
        const closestX = Math.max(chunk.x, Math.min(projectileX, chunk.x + chunk.width));
        const closestY = Math.max(chunk.y, Math.min(projectileY, chunk.y + chunk.height));
        
        const distance = Math.sqrt((projectileX - closestX) ** 2 + (projectileY - closestY) ** 2);
        
        if (distance <= projectileRadius) {
            return true;
        }
    }
    
    return false;
}

/**
 * Convert existing landscape to chunked system and replace original
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} worldWidth - World width in pixels
 * @param {number} worldHeight - World height in pixels
 * @param {Object} gameConfig - Game configuration
 * @returns {{landscapeData: {points: Array, chunks: TerrainChunk[]}, graphics: Phaser.GameObjects.Graphics}} Chunked landscape
 */
export function setupChunkedLandscape(scene, worldWidth, worldHeight, gameConfig) {
    info(`🏔️ Setting up chunked landscape: ${worldWidth}x${worldHeight}px for ${gameConfig.numPlayers} players`);
    
    // Generate points with same spacing as chunks for perfect alignment
    const baseY = worldHeight - 100;
    const chunkWidth = 40; // Match turret width (40px) for simpler alignment & support logic
    const numPoints = Math.floor(worldWidth / chunkWidth);
    const { points } = generateLandscapePoints(worldWidth, baseY, numPoints, gameConfig.numPlayers);
    
    // Convert to chunks with perfect 1:1 alignment
    const { chunks, graphics } = createChunkedLandscape(scene, points, worldWidth, worldHeight, chunkWidth);
    
    const landscapeData = { points, chunks };
    
    return { landscapeData, graphics };
}

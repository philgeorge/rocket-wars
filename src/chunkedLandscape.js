// chunkedLandscape.js
// Chunked terrain system for destructible landscape in Rocket Wars

import { WORLD_HEIGHT } from './constants.js';
import { generateLandscapePoints } from './landscape.js';
import { loadDebugSettings } from './storage.js';

/**
 * Debug settings for chunked landscape
 */
const debugSettings = {
    landscapeChunkOutlines: false
};

// Load debug settings on module initialization
loadDebugSettings(debugSettings);

/**
 * @typedef {Object} TerrainChunk
 * @property {number} x - X position of chunk
 * @property {number} y - Y position (top of chunk)
 * @property {number} width - Width of chunk
 * @property {number} height - Height of chunk
 * @property {boolean} destroyed - Whether chunk is destroyed
 * @property {boolean} falling - Whether chunk is currently falling
 * @property {number} fallSpeed - Current fall velocity
 * @property {number} originalY - Original Y position before falling
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
export function createChunkedLandscape(scene, points, worldWidth, worldHeight, chunkWidth = 30) {
    console.log('🏔️ Converting landscape points to chunks...');
    
    const chunks = [];
    const numChunks = Math.floor(worldWidth / chunkWidth);
    const actualChunkWidth = worldWidth / numChunks; // Adjust for perfect fit
    
    // Create graphics object for drawing chunks
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x3a5c2c, 1); // Same green as original landscape
    
    console.log(`Creating ${numChunks} chunks, each ${actualChunkWidth}px wide (aligned with landscape points)`);
    
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
            falling: false,
            fallSpeed: 0,
            originalY: terrainY,
            graphics: null // Will be set when drawing
        };
        
        chunks.push(chunk);
    }
    
    // Draw all chunks
    drawChunkedLandscape(graphics, chunks);
    
    console.log(`📊 Created ${chunks.length} terrain chunks`);
    
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
    if (debugSettings.landscapeChunkOutlines) {
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
 * Create explosion damage to terrain chunks
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object for redrawing
 * @param {number} impactX - X coordinate of projectile impact
 * @param {number} impactY - Y coordinate of projectile impact
 */
export function createTerrainDestruction(scene, chunks, graphics, impactX, impactY) {
    console.log(`💥 Creating terrain destruction at impact point (${impactX}, ${impactY})`);
    
    let chunksAffected = 0;
    let chunksDestroyed = 0;
    let chunksUnsupported = 0;
    
    // Find the chunk that contains the impact point (based on X coordinate)
    console.log(`🔍 Finding chunk containing impact point (${impactX}, ${impactY})...`);
    
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
            console.log(`🔍 Chunk ${i}: pos(${chunk.x.toFixed(1)}, ${chunk.y.toFixed(1)}), size(${chunk.width.toFixed(1)}x${chunk.height.toFixed(1)}), withinX: ${withinX}`);
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
            
            console.log(`   → X matches! Center(${chunkCenterX.toFixed(1)}, ${chunkCenterY.toFixed(1)}), closest point(${closestX.toFixed(1)}, ${closestY.toFixed(1)}), distance: ${distanceToChunk.toFixed(1)}`);
            
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
        console.log(`🎯 Selected closest chunk at index ${closestChunkIndex}: pos(${closestChunk.x.toFixed(1)}, ${closestChunk.y.toFixed(1)}), distance: ${closestDistance.toFixed(1)}`);
        
        chunksAffected++;
        
        // Remove a square block from the top of the chunk
        const squareBlockDamage = closestChunk.width; // Remove full chunk width in height
        
        // Apply damage from top
        const oldHeight = closestChunk.height;
        closestChunk.height = Math.max(0, closestChunk.height - squareBlockDamage);
        const heightReduction = oldHeight - closestChunk.height;
        closestChunk.y += heightReduction; // Move top down as height decreases
        
        console.log(`💥 Damaged chunk at x=${closestChunk.x.toFixed(1)}: removed ${heightReduction.toFixed(1)}px square block (${closestChunk.height.toFixed(1)}px remaining)`);
        
        // Destroy chunk if it becomes too small
        if (closestChunk.height <= 15) {
            closestChunk.destroyed = true;
            chunksDestroyed++;
            console.log(`💀 Chunk at x=${closestChunk.x.toFixed(1)} completely destroyed (too small)`);
        }
    } else {
        console.log(`⚠️ No chunk found with matching X coordinate for impact at (${impactX.toFixed(1)}, ${impactY.toFixed(1)})`);
    }
    
    // Make unsupported chunks fall
    chunks.forEach(chunk => {
        if (chunk.destroyed || chunk.falling) return;
        
        // Check if chunk has support (any non-destroyed chunk below it)
        const hasSupport = chunks.some(otherChunk => {
            return !otherChunk.destroyed &&
                   otherChunk !== chunk &&
                   Math.abs(otherChunk.x - chunk.x) < chunk.width && // Same X position
                   otherChunk.y > chunk.y && // Below this chunk
                   otherChunk.y < chunk.y + chunk.height + 50; // Within reasonable distance
        });
        
        // Also check if chunk is resting on ground level
        const isOnGround = (chunk.y + chunk.height) >= scene.physics.world.bounds.height - 50;
        
        if (!hasSupport && !isOnGround) {
            chunk.falling = true;
            chunk.fallSpeed = 0;
            chunksUnsupported++;
            console.log(`⬇️ Chunk at x=${chunk.x.toFixed(1)} is now falling (no support)`);
        }
    });
    
    // Redraw landscape
    drawChunkedLandscape(graphics, chunks);
    
    console.log(`🏔️ Destruction complete: ${chunksAffected} chunks affected, ${chunksDestroyed} destroyed, ${chunksUnsupported} falling`);
}

/**
 * Update physics for falling chunks
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object for redrawing
 */
export function updateFallingChunks(scene, chunks, graphics) {
    let anyChunkFalling = false;
    const gravity = 0.8; // Pixels per frame squared
    const groundLevel = scene.physics.world.bounds.height - 20;
    
    chunks.forEach(chunk => {
        if (!chunk.falling) return;
        
        anyChunkFalling = true;
        
        // Apply gravity
        chunk.fallSpeed += gravity;
        chunk.y += chunk.fallSpeed;
        
        // Check for collision with ground or other chunks
        let hasLanded = false;
        
        // Check ground collision
        if (chunk.y + chunk.height >= groundLevel) {
            chunk.y = groundLevel - chunk.height;
            hasLanded = true;
        }
        
        // Check collision with other non-falling chunks
        if (!hasLanded) {
            chunks.forEach(otherChunk => {
                if (otherChunk === chunk || otherChunk.destroyed || otherChunk.falling) return;
                
                // Check if chunks overlap horizontally
                const horizontalOverlap = !(chunk.x + chunk.width <= otherChunk.x || 
                                          chunk.x >= otherChunk.x + otherChunk.width);
                
                if (horizontalOverlap && chunk.y + chunk.height >= otherChunk.y) {
                    // Land on top of other chunk
                    chunk.y = otherChunk.y - chunk.height;
                    hasLanded = true;
                }
            });
        }
        
        if (hasLanded) {
            chunk.falling = false;
            chunk.fallSpeed = 0;
            console.log(`🏁 Chunk at x=${chunk.x.toFixed(1)} has landed`);
        }
    });
    
    // Redraw if any chunks moved
    if (anyChunkFalling) {
        drawChunkedLandscape(graphics, chunks);
    }
    
    return anyChunkFalling;
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
 * @returns {{landscapeData: {points: Array, flatBases: Array, chunks: TerrainChunk[]}, graphics: Phaser.GameObjects.Graphics}} Chunked landscape
 */
export function setupChunkedLandscape(scene, worldWidth, worldHeight, gameConfig) {
    console.log(`🏔️ Setting up chunked landscape: ${worldWidth}x${worldHeight}px for ${gameConfig.numPlayers} players`);
    
    // Generate points with same spacing as chunks for perfect alignment
    const baseY = worldHeight - 100;
    const chunkWidth = 30; // Match landscape point spacing for better granularity
    const numPoints = Math.floor(worldWidth / chunkWidth);
    const { points, flatBases } = generateLandscapePoints(worldWidth, baseY, numPoints, gameConfig.numPlayers);
    
    // Convert to chunks with perfect 1:1 alignment
    const { chunks, graphics } = createChunkedLandscape(scene, points, worldWidth, worldHeight, chunkWidth);
    
    // Store flat bases info for compatibility (chunked system includes original points and flatBases)
    const landscapeData = { points, flatBases, chunks };
    
    return { landscapeData, graphics };
}

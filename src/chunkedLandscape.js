// chunkedLandscape.js
// Chunked terrain system for destructible landscape in Rocket Wars

import { WORLD_HEIGHT } from './constants.js';
import { generateLandscapePoints } from './landscape.js';

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
 * @param {number} [chunkWidth=25] - Width of each chunk in pixels
 * @returns {{chunks: TerrainChunk[], graphics: Phaser.GameObjects.Graphics}} Chunk data and graphics
 */
export function createChunkedLandscape(scene, points, worldWidth, worldHeight, chunkWidth = 15) {
    console.log('🏔️ Converting landscape points to chunks...');
    
    const chunks = [];
    const numChunks = Math.floor(worldWidth / chunkWidth);
    const actualChunkWidth = worldWidth / numChunks; // Adjust for perfect fit
    
    // Create graphics object for drawing chunks
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x3a5c2c, 1); // Same green as original landscape
    
    console.log(`Creating ${numChunks} chunks, each ${actualChunkWidth}px wide`);
    
    // Convert points to chunks
    for (let i = 0; i < numChunks; i++) {
        const chunkX = i * actualChunkWidth;
        const chunkCenterX = chunkX + actualChunkWidth / 2;
        
        // Find the landscape height at this chunk's center position
        let terrainY = worldHeight - 100; // Default ground level
        
        // Interpolate between landscape points to find height
        for (let j = 0; j < points.length - 1; j++) {
            if (points[j].x <= chunkCenterX && points[j + 1].x >= chunkCenterX) {
                const t = (chunkCenterX - points[j].x) / (points[j + 1].x - points[j].x);
                terrainY = points[j].y + t * (points[j + 1].y - points[j].y);
                break;
            }
        }
        
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
 * Draw the chunked landscape
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object to draw with
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 */
export function drawChunkedLandscape(graphics, chunks) {
    graphics.clear();
    
    // Set fill style for green terrain chunks
    graphics.fillStyle(0x3a5c2c, 1); // Same green as original landscape
    
    chunks.forEach(chunk => {
        if (!chunk.destroyed) {
            // Draw chunk as a filled rectangle
            graphics.fillRect(chunk.x, chunk.y, chunk.width, chunk.height);
        }
    });
}

/**
 * Create explosion damage to terrain chunks
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {TerrainChunk[]} chunks - Array of terrain chunks
 * @param {Phaser.GameObjects.Graphics} graphics - Graphics object for redrawing
 * @param {number} explosionX - X coordinate of explosion
 * @param {number} explosionY - Y coordinate of explosion
 * @param {number} explosionRadius - Radius of explosion
 */
export function createTerrainDestruction(scene, chunks, graphics, explosionX, explosionY, explosionRadius) {
    console.log(`💥 Creating terrain destruction at (${explosionX}, ${explosionY}) with radius ${explosionRadius}`);
    
    let chunksAffected = 0;
    let chunksDestroyed = 0;
    let chunksUnsupported = 0;
    
    // Damage chunks within explosion radius
    chunks.forEach(chunk => {
        if (chunk.destroyed) return;
        
        // Check if chunk overlaps with explosion circle
        const chunkCenterX = chunk.x + chunk.width / 2;
        const chunkCenterY = chunk.y + chunk.height / 2;
        const distance = Math.sqrt((chunkCenterX - explosionX) ** 2 + (chunkCenterY - explosionY) ** 2);
        
        if (distance <= explosionRadius) {
            chunksAffected++;
            
            // Calculate damage amount based on distance from explosion center
            const damageIntensity = 1 - (distance / explosionRadius); // 1.0 at center, 0.0 at edge
            const maxDamagePerExplosion = 40; // Maximum pixels of height to remove
            const actualDamage = maxDamagePerExplosion * damageIntensity;
            
            // Reduce chunk height from the top
            const oldHeight = chunk.height;
            chunk.height = Math.max(0, chunk.height - actualDamage);
            const heightReduction = oldHeight - chunk.height;
            chunk.y += heightReduction; // Move top down as height decreases
            
            console.log(`💥 Damaged chunk at x=${chunk.x.toFixed(1)}: reduced height by ${heightReduction.toFixed(1)}px (${chunk.height.toFixed(1)}px remaining)`);
            
            // Destroy chunk if it becomes too small
            if (chunk.height <= 5) {
                chunk.destroyed = true;
                chunksDestroyed++;
                console.log(`💀 Chunk at x=${chunk.x.toFixed(1)} completely destroyed (too small)`);
            }
        }
    });
    
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
 * @returns {{landscapeData: {chunks: TerrainChunk[]}, graphics: Phaser.GameObjects.Graphics}} Chunked landscape
 */
export function setupChunkedLandscape(scene, worldWidth, worldHeight, gameConfig) {
    console.log(`🏔️ Setting up chunked landscape: ${worldWidth}x${worldHeight}px for ${gameConfig.numPlayers} players`);
    
    // First generate points using existing system
    const baseY = worldHeight - 100;
    const numPoints = Math.floor(worldWidth / 50);
    const { points, flatBases } = generateLandscapePoints(worldWidth, baseY, numPoints, gameConfig.numPlayers);
    
    // Convert to chunks
    const { chunks, graphics } = createChunkedLandscape(scene, points, worldWidth, worldHeight);
    
    // Store flat bases info for compatibility (chunked system includes original points and flatBases)
    const landscapeData = { points, flatBases, chunks };
    
    return { landscapeData, graphics };
}

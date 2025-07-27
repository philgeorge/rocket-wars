// landscape.js
// Landscape generation and drawing utilities for Rocket Wars

import { WORLD_HEIGHT } from './constants.js';
import { setupChunkedLandscape } from './chunkedLandscape.js';

/**
 * Generate landscape points with alternating flat and mountainous sections
 * @param {number} width - World width in pixels
 * @param {number} baseY - Base Y coordinate for the landscape
 * @param {number} numPoints - Number of points to generate for the landscape
 * @param {number} [numPlayers=2] - Number of players (determines number of sections)
 * @returns {{points: Array<{x: number, y: number}>, flatBases: Array<{start: number, end: number}>}} Generated landscape data
 */
export function generateLandscapePoints(width, baseY, numPoints, numPlayers = 2) {
    const segment = width / (numPoints - 1);
    const points = [];
    const flatBases = [];
    
    // Calculate sections: 2 * numPlayers sections
    const numSections = 2 * numPlayers;
    const sectionSize = Math.floor(numPoints / numSections);
    
    console.log(`Generating landscape with ${numSections} sections for ${numPlayers} players`);

    // 1. Generate initial random landscape with varied terrain across sections
    for (let i = 0; i < numPoints; i++) {
        let x = Math.floor((i / (numPoints - 1)) * width);
        let y;
        
        // Determine which section this point is in
        const sectionIndex = Math.floor(i / sectionSize);
        const sectionProgress = (i % sectionSize) / sectionSize; // 0 to 1 within section
        
        // Create varied terrain: some sections flat, some mountainous
        if (sectionIndex % 2 === 0) {
            // Even sections: flatter terrain
            y = baseY + Math.floor(Math.random() * 80 - 40); // -40 to +40px variation
        } else {
            // Odd sections: mountainous terrain (50-80% of world height)
            // Calculate mountain height: 50-80% of world height from top = 400-640px from top
            // Since baseY is typically around 700px, mountains should go down 60-300px from baseY
            const minMountainHeight = WORLD_HEIGHT * 0.5; // 50% = 400px from top
            const maxMountainHeight = WORLD_HEIGHT * 0.8; // 80% = 640px from top
            
            // Random height between min and max for this section
            const sectionMountainHeight = minMountainHeight + Math.random() * (maxMountainHeight - minMountainHeight);
            
            // Calculate how far down from baseY this mountain should go
            const mountainDepth = baseY - (WORLD_HEIGHT - sectionMountainHeight);
            
            // Use sine wave for mountain shape with the calculated depth
            y = baseY - mountainDepth * Math.sin(Math.PI * sectionProgress) + Math.floor(Math.random() * 40 - 20); // ±20px noise
        }
        
        points.push({ x, y });
    }

    // Set flat base length in pixels
    const minFlatWidthPx = 40;
    const maxFlatWidthPx = 80; // Reduced max width to fit 2 bases per section
    const minSpacingPx = 30; // Minimum spacing between bases

    // 2. Create up to 2 flat bases in each section
    for (let sectionIndex = 0; sectionIndex < numSections; sectionIndex++) {
        const sectionStartIdx = sectionIndex * sectionSize;
        const sectionEndIdx = Math.min((sectionIndex + 1) * sectionSize - 1, numPoints - 1);
        
        // Skip very small sections
        if (sectionEndIdx - sectionStartIdx < 5) continue; // Need at least 5 points for 2 bases
        
        const sectionPoints = sectionEndIdx - sectionStartIdx + 1;
        const availableWidth = (sectionPoints - 1) * segment; // Width in pixels
        
        // Calculate how many bases can fit in this section
        const minRequiredForTwoBases = (2 * minFlatWidthPx) + minSpacingPx;
        const maxBasesInSection = availableWidth >= minRequiredForTwoBases ? 2 : 1;
        
        console.log(`Section ${sectionIndex + 1}: ${sectionPoints} points, ${Math.round(availableWidth)}px wide, attempting ${maxBasesInSection} bases`);
        
        for (let baseInSection = 0; baseInSection < maxBasesInSection; baseInSection++) {
            // Calculate available space for this base
            let availableStart, availableEnd;
            
            if (maxBasesInSection === 1) {
                // Single base: use most of the section
                availableStart = sectionStartIdx + 1;
                availableEnd = sectionEndIdx - 1;
            } else {
                // Two bases: divide the section
                const midPoint = Math.floor((sectionStartIdx + sectionEndIdx) / 2);
                const spacingPoints = Math.ceil(minSpacingPx / segment);
                
                if (baseInSection === 0) {
                    // First base: start of section to mid-point minus spacing
                    availableStart = sectionStartIdx + 1;
                    availableEnd = midPoint - Math.floor(spacingPoints / 2);
                } else {
                    // Second base: mid-point plus spacing to end of section
                    availableStart = midPoint + Math.ceil(spacingPoints / 2);
                    availableEnd = sectionEndIdx - 1;
                }
            }
            
            // Make sure we have enough space
            if (availableEnd - availableStart < 2) continue;
            
            // Calculate flat base size for this specific base
            const availableWidthForBase = (availableEnd - availableStart) * segment;
            const maxFlatWidthForBase = Math.min(maxFlatWidthPx, availableWidthForBase - 20); // Leave some margin
            const flatWidthPx = Math.max(minFlatWidthPx, 
                minFlatWidthPx + Math.floor(Math.random() * (maxFlatWidthForBase - minFlatWidthPx + 1)));
            const flatLen = Math.max(2, Math.round(flatWidthPx / segment));
            
            // Ensure flat base fits within available space
            const maxFlatLen = Math.min(flatLen, availableEnd - availableStart);
            if (maxFlatLen < 2) continue;
            
            // Position flat base randomly within the available space
            const minStart = availableStart;
            const maxStart = availableEnd - maxFlatLen;
            
            if (minStart <= maxStart) {
                const baseStart = minStart + Math.floor(Math.random() * (maxStart - minStart + 1));
                const baseEnd = baseStart + maxFlatLen - 1;
                
                // Calculate the average Y position for the flat section
                let totalY = 0;
                for (let j = baseStart; j <= baseEnd; j++) {
                    totalY += points[j].y;
                }
                const flatY = Math.round(totalY / (baseEnd - baseStart + 1));
                
                // Set all points in the flat section to the same Y position
                for (let j = baseStart; j <= baseEnd; j++) {
                    points[j].y = flatY;
                }
                
                console.log(`Created flat base ${baseInSection + 1} in section ${sectionIndex + 1}: points ${baseStart}-${baseEnd}, Y=${flatY}`);
                flatBases.push({ start: baseStart, end: baseEnd });
            }
        }
    }

    // Final verification: ensure all flat bases are actually flat
    flatBases.forEach((base, index) => {
        const expectedY = points[base.start].y;
        let allFlat = true;
        
        for (let i = base.start; i <= base.end; i++) {
            if (points[i].y !== expectedY) {
                console.error(`CRITICAL: Flat base ${index} point ${i} has Y=${points[i].y}, expected Y=${expectedY}`);
                points[i].y = expectedY; // Force fix it
                allFlat = false;
            }
        }
        
        if (!allFlat) {
            console.warn(`Fixed flat base ${index} inconsistencies`);
        }
    });

    console.log(`📊 Landscape generation complete: Created ${flatBases.length} flat bases for ${numPlayers} players across ${numSections} sections (up to 2 per section)`);
    console.log(`📊 Flat bases summary:`, flatBases.map((base, index) => `Base ${index}: points ${base.start}-${base.end} (width: ${base.end - base.start + 1} points)`));

    return { points, flatBases };
}

/**
 * Draw the landscape using Phaser graphics
 * @param {Phaser.GameObjects.Graphics} graphics - Phaser graphics object to draw with
 * @param {Array<{x: number, y: number}>} points - Array of landscape points
 * @param {number} worldWidth - World width in pixels
 * @param {number} worldHeight - World height in pixels
 * @param {Array<{start: number, end: number}>} flatBases - Array of flat base sections
 * @returns {void}
 */
export function drawLandscape(graphics, points, worldWidth, worldHeight, flatBases) {
    // Draw green landscape
    graphics.beginPath();
    graphics.moveTo(0, worldHeight);
    points.forEach(pt => graphics.lineTo(pt.x, pt.y));
    graphics.lineTo(worldWidth, worldHeight);
    graphics.closePath();
    graphics.fillPath();

    // Draw brown lines for flat base areas
    graphics.lineStyle(2, 0x8B4513, 1); // thinner brown line (4px)
    flatBases.forEach((base, index) => {
        // Draw a brown line along the flat base
        const start = points[base.start];
        const end = points[base.end];
        if (start && end) {
            // Verify the flat base is actually flat
            let isFlat = true;
            let maxDifference = 0;
            const expectedY = start.y;
            
            for (let i = base.start; i <= base.end; i++) {
                const difference = Math.abs(points[i].y - expectedY);
                maxDifference = Math.max(maxDifference, difference);
                if (difference > 0.1) { // Allow tiny floating point differences
                    isFlat = false;
                }
            }
            
            if (!isFlat) {
                console.warn(`Flat base ${index} is not actually flat! Points ${base.start}-${base.end}, max difference: ${maxDifference}px`);
                // Log the actual Y values for debugging
                const yValues = [];
                for (let i = base.start; i <= base.end; i++) {
                    yValues.push(Math.round(points[i].y * 100) / 100);
                }
                console.warn(`Y values: [${yValues.join(', ')}]`);
            }
            
            graphics.beginPath();
            graphics.moveTo(start.x, start.y);
            graphics.lineTo(end.x, end.y);
            graphics.strokePath();
        }
    });
}

/**
 * Setup the complete world landscape including generation, drawing, and boundaries
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {number} worldWidth - World width in pixels
 * @param {number} worldHeight - World height in pixels  
 * @param {Object} gameConfig - Game configuration object
 * @param {boolean} [useChunkedTerrain=false] - Whether to use chunked terrain system
 * @returns {{landscapeData: {points: Array, flatBases: Array, chunks?: Array}, graphics: Phaser.GameObjects.Graphics}} Landscape setup result
 */
export function setupWorldLandscape(scene, worldWidth, worldHeight, gameConfig, useChunkedTerrain = false) {
    console.log(`Setting up world landscape: ${worldWidth}x${worldHeight}px for ${gameConfig.numPlayers} players${useChunkedTerrain ? ' (CHUNKED)' : ''}`);
    
    if (useChunkedTerrain) {
        // Use the new chunked terrain system
        return setupChunkedLandscape(scene, worldWidth, worldHeight, gameConfig);
    }
    
    // Original point-based system
    // Create graphics object for drawing
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x3a5c2c, 1); // greenish color for landscape
    
    // Generate and draw random landscape
    const baseY = worldHeight - 100;
    const numPoints = Math.floor(worldWidth / 50); // Calculate points based on world width
    console.log(`Generating landscape with world width: ${worldWidth}px, height: ${worldHeight}px, points: ${numPoints}`);
    
    const { points, flatBases } = generateLandscapePoints(worldWidth, baseY, numPoints, gameConfig.numPlayers);
    drawLandscape(graphics, points, worldWidth, worldHeight, flatBases);
    
    
    // Return landscape data for collision detection and graphics object
    const landscapeData = { points, flatBases };
    return { landscapeData, graphics };
}

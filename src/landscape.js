// landscape.js
// Landscape generation and drawing utilities for Rocket Wars

import { WORLD_HEIGHT } from './constants.js';
import { info, trace } from './logger.js';

/**
 * Generate landscape points with alternating flat and mountainous sections
 * @param {number} width - World width in pixels
 * @param {number} baseY - Base Y coordinate for the landscape
 * @param {number} numPoints - Number of points to generate for the landscape
 * @param {number} [numPlayers=2] - Number of players (determines number of sections)
 * @returns {{points: Array<{x: number, y: number}>}} Generated landscape data (flatBases removed)
 */
export function generateLandscapePoints(width, baseY, numPoints, numPlayers = 2) {
    const _segment = width / (numPoints - 1); // retained for historical reference (was used in flat base generation)
    const points = [];
    
    // Calculate sections: 2 * numPlayers sections
    const numSections = 2 * numPlayers;
    const sectionSize = Math.floor(numPoints / numSections);
    
    info(`Generating landscape with ${numSections} sections for ${numPlayers} players`);

    // 1. Generate initial random landscape with varied terrain across sections
    for (let i = 0; i < numPoints; i++) {
        const x = Math.floor((i / (numPoints - 1)) * width);
        let y;
        
        // Determine which section this point is in
        const sectionIndex = Math.floor(i / sectionSize);
        const sectionProgress = (i % sectionSize) / sectionSize; // 0 to 1 within section
        
        // Create varied terrain: some sections flat, some mountainous
        if (sectionIndex % 2 === 0) {
            // Even sections: flatter terrain with reduced variation
            y = baseY + Math.floor(Math.random() * 40 - 20); // ±20px variation
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
            
            // Use sine wave for mountain shape with reduced noise
            y = baseY - mountainDepth * Math.sin(Math.PI * sectionProgress) + Math.floor(Math.random() * 20 - 10); // ±10px noise
        }
        
        points.push({ x, y });
    }

    // 2. Apply smoothing to reduce spikiness between adjacent points
    trace('Applying smoothing to landscape points...');
    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        // Calculate maximum allowed height difference (25px per 30px horizontal distance)
        const maxHeightDiff = 25; // Maximum height change between adjacent 30px points
        
        // Check if current point creates too sharp a transition
        const heightDiffToPrev = Math.abs(curr.y - prev.y);
        const heightDiffToNext = Math.abs(curr.y - next.y);
        
        if (heightDiffToPrev > maxHeightDiff || heightDiffToNext > maxHeightDiff) {
            // Smooth this point by averaging with neighbors (weighted)
            const smoothedY = (prev.y * 0.25 + curr.y * 0.5 + next.y * 0.25);
            curr.y = Math.round(smoothedY);
            trace(`🏔️ Smoothed point ${i}: was ${points[i].y}, now ${curr.y}`);
        }
    }

    info(`📊 Landscape generation complete (points only) across ${numSections} sections for ${numPlayers} players`);
    return { points };
}

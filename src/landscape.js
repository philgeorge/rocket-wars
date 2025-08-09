// landscape.js
// Landscape generation and drawing utilities for Rocket Wars

import { WORLD_HEIGHT } from './constants.js';
import { info, trace, warn, error as logError } from './logger.js';

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
        
        trace(`Section ${sectionIndex + 1}: ${sectionPoints} points, ${Math.round(availableWidth)}px wide, attempting ${maxBasesInSection} bases`);
        
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
                
                trace(`Created flat base ${baseInSection + 1} in section ${sectionIndex + 1}: points ${baseStart}-${baseEnd}, Y=${flatY}`);
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
                logError(`CRITICAL: Flat base ${index} point ${i} has Y=${points[i].y}, expected Y=${expectedY}`);
                points[i].y = expectedY; // Force fix it
                allFlat = false;
            }
        }
        
        if (!allFlat) {
            warn(`Fixed flat base ${index} inconsistencies`);
        }
    });

    info(`📊 Landscape generation complete: Created ${flatBases.length} flat bases for ${numPlayers} players across ${numSections} sections (up to 2 per section)`);
    trace(`📊 Flat bases summary:`, flatBases.map((base, index) => `Base ${index}: points ${base.start}-${base.end} (width: ${base.end - base.start + 1} points)`));

    return { points, flatBases };
}

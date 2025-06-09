// landscape.js
// Landscape generation and drawing utilities for Rocket Wars

export function generateLandscapePoints(width, baseY, numPoints) {
    const segment = width / (numPoints - 1);
    const points = [];
    const flatBases = [];
    const leftThird = Math.floor(numPoints / 3);
    const rightThird = numPoints - leftThird;

    // 1. Generate initial random landscape (mountains in middle, more variation at edges)
    for (let i = 0; i < numPoints; i++) {
        let x = Math.floor((i / (numPoints - 1)) * width);
        let y;
        if (i < leftThird || i >= rightThird) {
            // Edges: more variation than before, but not as much as mountains
            y = baseY + Math.floor(Math.random() * 100 - 50); // -16 to +16px variation
        } else {
            // Middle: mountains, 50% higher than before
            const t = (i - leftThird) / (rightThird - leftThird);
            y = baseY - 350 * Math.sin(Math.PI * t) + Math.floor(Math.random() * 60 - 30); // 180px peak, ±30px noise
        }
        points.push({ x, y });
    }

    // Set flat base length in pixels
    const minFlatWidthPx = 40;
    const maxFlatWidthPx = 100;

    // 2. Forcibly insert flat base sections in left and right thirds (avoiding overlaps)
    function insertFlatBases(startIdx, endIdx, clampToEdge = false, isLeft = false) {
        const numFlats = 3;
        const usedRanges = []; // Track used ranges to avoid overlaps
        
        for (let f = 0; f < numFlats; f++) {
            const flatWidthPx = minFlatWidthPx + Math.floor(Math.random() * (maxFlatWidthPx - minFlatWidthPx + 1));
            const flatLen = Math.max(2, Math.round(flatWidthPx / segment));
            if (endIdx - startIdx - flatLen <= 0) continue; // skip if not enough room
            
            let minStart = startIdx;
            let maxStart = endIdx - flatLen;
            
            // For left side, ensure base doesn't start too close to the left edge
            if (isLeft) {
                // Find the first point with x >= minFlatWidthPx/2
                for (let i = startIdx; i < endIdx; i++) {
                    if (points[i].x >= minFlatWidthPx / 2) {
                        minStart = i;
                        break;
                    }
                }
            }
            
            // Try to find a non-overlapping position
            let baseStart = -1;
            let attempts = 0;
            while (attempts < 20 && baseStart === -1) { // Max 20 attempts to find a spot
                const candidateStart = minStart + Math.floor(Math.random() * Math.max(1, (maxStart - minStart + 1)));
                const candidateEnd = candidateStart + flatLen - 1;
                
                // Check if this range overlaps with existing flat bases
                let overlaps = false;
                for (const range of usedRanges) {
                    if (!(candidateEnd < range.start || candidateStart > range.end)) {
                        overlaps = true;
                        break;
                    }
                }
                
                if (!overlaps) {
                    baseStart = candidateStart;
                    // Apply edge clamping if needed
                    if (clampToEdge && baseStart < 1) baseStart = 1;
                    if (clampToEdge && baseStart + flatLen > numPoints - 2) baseStart = numPoints - 2 - flatLen;
                }
                attempts++;
            }
            
            if (baseStart === -1) {
                console.warn(`Could not find non-overlapping position for flat base ${f + 1} in ${isLeft ? 'left' : 'right'} section`);
                continue; // Skip this flat base
            }
            
            // Record this range as used
            usedRanges.push({ start: baseStart, end: baseStart + flatLen - 1 });
            
            // Calculate the average Y position of the points in this range to create a stable flat section
            let totalY = 0;
            let minY = Infinity;
            let maxY = -Infinity;
            
            for (let j = 0; j < flatLen; j++) {
                const y = points[baseStart + j].y;
                totalY += y;
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
            
            // Use average Y, but ensure it's reasonable for the terrain
            let flatY = totalY / flatLen;
            
            // If there's too much variation in the original points, prefer a more conservative approach
            const yVariation = maxY - minY;
            if (yVariation > 50) {
                // Use the median-like approach: average of min and max
                flatY = (minY + maxY) / 2;
                console.log(`Large Y variation (${Math.round(yVariation)}px) in flat base, using median approach`);
            }
            
            // Ensure the flat Y is exactly the same for all points (avoid floating point issues)
            flatY = Math.round(flatY);
            
            // Set all points in the flat section to the exact same Y position
            for (let j = 0; j < flatLen; j++) {
                const pointIndex = baseStart + j;
                points[pointIndex].y = flatY;
            }
            
            // Debug output to verify flat sections
            console.log(`Created flat base ${f + 1} in ${isLeft ? 'left' : 'right'} section: points ${baseStart}-${baseStart + flatLen - 1}, Y=${flatY}, width=${flatWidthPx}px, original variation=${Math.round(yVariation)}px`);
            
            flatBases.push({ start: baseStart, end: baseStart + flatLen - 1 });
        }
    }
    // Left third (clamp to avoid index 0, and ensure visible)
    insertFlatBases(0, leftThird, true, true);
    // Right third (clamp to avoid last index)
    insertFlatBases(rightThird, numPoints - 1, true, false);

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
        
        if (allFlat) {
            console.log(`✓ Verified flat base ${index} is properly flat`);
        } else {
            console.warn(`Fixed flat base ${index} inconsistencies`);
        }
    });

    return { points, flatBases };
}

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
                    yValues.push(Math.round(points[i].y * 100) / 100); // Round to 2 decimal places
                }
                console.warn(`Y values: [${yValues.join(', ')}]`);
            } else {
                console.log(`✓ Flat base ${index} is properly flat at Y=${Math.round(expectedY)}`);
            }
            
            graphics.beginPath();
            graphics.moveTo(start.x, start.y);
            graphics.lineTo(end.x, end.y);
            graphics.strokePath();
        }
    });
    graphics.lineStyle(); // reset
}

export function drawWorldBoundaries(graphics, worldWidth, worldHeight) {
    // Mark the left and right edges of the world with vertical lines
    graphics.lineStyle(4, 0xff0000, 1); // Red, 4px
    
    // Left edge
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(0, worldHeight);
    graphics.strokePath();
    
    // Right edge
    graphics.beginPath();
    graphics.moveTo(worldWidth - 1, 0);
    graphics.lineTo(worldWidth - 1, worldHeight);
    graphics.strokePath();
    
    graphics.lineStyle(); // reset
}

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

    // 2. Forcibly insert 3 flat base sections in left and right thirds
    function insertFlatBases(startIdx, endIdx, clampToEdge = false, isLeft = false) {
        const numFlats = 3; 
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
            // Clamp baseStart to valid range
            let baseStart = minStart + Math.floor(Math.random() * Math.max(1, (maxStart - minStart + 1)));
            if (clampToEdge && baseStart < 1) baseStart = 1;
            if (clampToEdge && baseStart + flatLen > numPoints - 2) baseStart = numPoints - 2 - flatLen;
            const baseY = points[baseStart].y;
            for (let j = 0; j < flatLen; j++) {
                points[baseStart + j].y = baseY;
            }
            flatBases.push({ start: baseStart, end: baseStart + flatLen - 1 });
        }
    }
    // Left third (clamp to avoid index 0, and ensure visible)
    insertFlatBases(0, leftThird, true, true);
    // Right third (clamp to avoid last index)
    insertFlatBases(rightThird, numPoints - 1, true, false);

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
    flatBases.forEach(base => {
        // Draw a brown line along the flat base
        const start = points[base.start];
        const end = points[base.end];
        if (start && end) {
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

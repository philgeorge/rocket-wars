// landscape.js
// Landscape generation and drawing utilities for Rocket Wars

export function generateLandscapePoints(width, baseY, numPoints) {
    const segment = width / (numPoints - 1);
    const points = [];
    // Determine number of mountains (1, 2, or 3)
    const numMountains = Phaser.Math.Between(1, 3);
    // Pick random mountain centers in the middle third
    const mountainCenters = [];
    const minX = width / 3;
    const maxX = 2 * width / 3;
    for (let i = 0; i < numMountains; i++) {
        mountainCenters.push(Phaser.Math.Between(minX, maxX));
    }
    // Calculate flat base positions in left and right thirds
    const flatBases = [];
    const flatBaseCount = 3;
    const flatBaseWidths = Array.from({length: flatBaseCount * 2}, () => Phaser.Math.Between(80, 120));
    // Left third
    let leftUsed = [];
    for (let i = 0; i < flatBaseCount; i++) {
        let start;
        do {
            start = Phaser.Math.Between(0, Math.floor(width / 3 - flatBaseWidths[i]));
        } while (leftUsed.some(range => Math.abs(start - range) < 150));
        leftUsed.push(start);
        flatBases.push({ start, end: start + flatBaseWidths[i], y: baseY - 10 });
    }
    // Right third
    let rightUsed = [];
    for (let i = 0; i < flatBaseCount; i++) {
        let start;
        do {
            start = Phaser.Math.Between(Math.floor(2 * width / 3), Math.floor(width - flatBaseWidths[i+3]));
        } while (rightUsed.some(range => Math.abs(start - range) < 150));
        rightUsed.push(start);
        flatBases.push({ start, end: start + flatBaseWidths[i+3], y: baseY - 10 });
    }
    // For each point, add variance, mountains, and flatten if in a base zone
    for (let i = 0; i < numPoints; i++) {
        let x = i * segment;
        let variance = Phaser.Math.Between(-80, 40);
        if (i === 0 || i === numPoints - 1) variance = 0;
        // Add mountain effect if within range of a mountain center
        let mountainBoost = 0;
        mountainCenters.forEach(center => {
            const dist = Math.abs(x - center);
            const mountainWidth = width / 10;
            if (dist < mountainWidth) {
                mountainBoost += Math.round(180 * (1 - (dist / mountainWidth) ** 2));
            }
        });
        // Check if x is in a flat base zone
        let flatBase = flatBases.find(base => x >= base.start && x <= base.end);
        let y;
        if (flatBase) {
            y = flatBase.y;
        } else {
            y = baseY + variance - mountainBoost;
        }
        points.push({ x, y });
    }
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
    graphics.lineStyle(8, 0x8B4513, 1); // thick brown line
    flatBases.forEach(base => {
        // Find points within this base area
        const basePoints = points.filter(pt => pt.x >= base.start && pt.x <= base.end);
        if (basePoints.length > 1) {
            graphics.beginPath();
            graphics.moveTo(basePoints[0].x, basePoints[0].y);
            for (let i = 1; i < basePoints.length; i++) {
                graphics.lineTo(basePoints[i].x, basePoints[i].y);
            }
            graphics.strokePath();
        }
    });
    graphics.lineStyle(); // reset
}

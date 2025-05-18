// main.js
// Entry point for Rocket Wars game logic

import { generateLandscapePoints, drawLandscape } from './landscape.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#222',
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    input: {
        mouse: { preventDefault: false },
        touch: { preventDefault: false }
    },
    // Enable physics if needed later
};

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 600;

const game = new Phaser.Game(config);

function preload() {
    // Load assets here
}

function create() {
    // Set the game canvas size to match the world size for full scrollable area
    this.scale.resize(WORLD_WIDTH, WORLD_HEIGHT);

    // Draw a simple 2D landscape using graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0x3a5c2c, 1); // greenish color for landscape
    // Generate and draw random landscape
    const baseY = WORLD_HEIGHT - 100;
    const numPoints = 40;
    const { points, flatBases } = generateLandscapePoints(WORLD_WIDTH, baseY, numPoints);
    drawLandscape(graphics, points, WORLD_WIDTH, WORLD_HEIGHT, flatBases);

    // Mark the left and right edges of the world with vertical lines
    graphics.lineStyle(4, 0xff0000, 1); // Red, 4px
    // Left edge
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(0, WORLD_HEIGHT);
    graphics.strokePath();
    // Right edge
    graphics.beginPath();
    graphics.moveTo(WORLD_WIDTH - 1, 0);
    graphics.lineTo(WORLD_WIDTH - 1, WORLD_HEIGHT);
    graphics.strokePath();
    graphics.lineStyle(); // reset
}

function update() {
    // No camera panning logic needed
}

// Optionally, update the camera bounds in create() if you want the world height to match the viewport height dynamically:
// this.cameras.main.setBounds(0, 0, WORLD_WIDTH, this.sys.game.config.height);

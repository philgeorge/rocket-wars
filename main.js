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
    // Enable physics if needed later
};

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 600;

const game = new Phaser.Game(config);

function preload() {
    // Load assets here
}

function create() {
    // Set world bounds larger than the viewport
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics && this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Draw a simple 2D landscape using graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0x3a5c2c, 1); // greenish color for landscape
    // Generate and draw random landscape
    const baseY = WORLD_HEIGHT - 100;
    const numPoints = 40;
    const { points, flatBases } = generateLandscapePoints(WORLD_WIDTH, baseY, numPoints);
    drawLandscape(graphics, points, WORLD_WIDTH, WORLD_HEIGHT, flatBases);

    // Enable camera panning with arrow keys
    this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    // Camera panning logic
    const cam = this.cameras.main;
    if (this.cursors) {
        if (this.cursors.left.isDown) {
            cam.scrollX -= 8;
        } else if (this.cursors.right.isDown) {
            cam.scrollX += 8;
        }
    }
}

// Optionally, update the camera bounds in create() if you want the world height to match the viewport height dynamically:
// this.cameras.main.setBounds(0, 0, WORLD_WIDTH, this.sys.game.config.height);

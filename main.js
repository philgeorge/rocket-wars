// main.js
// Entry point for Rocket Wars game logic

import { generateLandscapePoints, drawLandscape, drawWorldBoundaries } from './landscape.js';
import { createGunTurret, placeTurretsOnBases } from './base.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight - 20, // Account for margin
    backgroundColor: '#222',
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 600;

const game = new Phaser.Game(config);

function preload() {
    // Load assets here
}

function create() {
    // Set camera bounds to the world size
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    // Handle browser resize to show more/less of the world
    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight - 20; // Account for margin
            
            // Resize the game renderer
            this.scale.resize(newWidth, newHeight);
            
            // Update camera viewport size to show more/less of the world
            this.cameras.main.setSize(newWidth, newHeight);
        }, 100); // Throttle resize events
    };
    
    // Initial resize to fit container
    handleResize();
    
    // Listen for window resize events
    window.addEventListener('resize', handleResize);
    
    // Draw a simple 2D landscape using graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0x3a5c2c, 1); // greenish color for landscape
    // Generate and draw random landscape
    const baseY = WORLD_HEIGHT - 100;
    const numPoints = 40;
    const { points, flatBases } = generateLandscapePoints(WORLD_WIDTH, baseY, numPoints);
    drawLandscape(graphics, points, WORLD_WIDTH, WORLD_HEIGHT, flatBases);
    
    // Mark the world boundaries
    drawWorldBoundaries(graphics, WORLD_WIDTH, WORLD_HEIGHT);

    // Create and place gun turrets on the flat bases
    const turrets = placeTurretsOnBases(this, flatBases, points);
    console.log(`Created ${turrets.length} turrets:`, turrets.map(t => ({team: t.team, x: t.x, y: t.y})));
    
    // Store turrets for access in input handlers
    this.turrets = turrets;
    this.currentPlayerTurret = null;
    
    // Set up camera controls and input
    setupCameraAndInput(this);

    // Start camera focused on the left turret (player 1)
    if (turrets.length > 0) {
        this.cameras.main.centerOn(turrets[0].x, turrets[0].y);
    }
}

function update() {
    // Camera controls are handled in setupCameraAndInput
    
    // Keyboard camera movement
    if (this.cameraControls && !this.cameraControls.isDragging() && !this.currentPlayerTurret) {
        const camera = this.cameras.main;
        const speed = 5;
        
        if (this.cameraControls.cursors.left.isDown || this.cameraControls.wasd.A.isDown) {
            camera.scrollX -= speed;
        }
        if (this.cameraControls.cursors.right.isDown || this.cameraControls.wasd.D.isDown) {
            camera.scrollX += speed;
        }
        if (this.cameraControls.cursors.up.isDown || this.cameraControls.wasd.W.isDown) {
            camera.scrollY -= speed;
        }
        if (this.cameraControls.cursors.down.isDown || this.cameraControls.wasd.S.isDown) {
            camera.scrollY += speed;
        }
    }
}

function setupCameraAndInput(scene) {
    // Camera drag controls
    let isDragging = false;
    let dragStartX, dragStartY;
    let cameraStartX, cameraStartY;
    
    // Mouse/touch controls for camera panning
    scene.input.on('pointerdown', (pointer) => {
        // Check if we clicked on a turret first
        let clickedTurret = null;
        scene.turrets.forEach(turret => {
            const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, turret.x, turret.y);
            if (distance < 30) { // 30px radius
                clickedTurret = turret;
            }
        });
        
        if (clickedTurret) {
            // Start aiming
            console.log(`Clicked on ${clickedTurret.team} turret`);
            scene.currentPlayerTurret = clickedTurret;
            clickedTurret.startAiming();
        } else {
            // Start camera dragging
            isDragging = true;
            dragStartX = pointer.x;
            dragStartY = pointer.y;
            cameraStartX = scene.cameras.main.scrollX;
            cameraStartY = scene.cameras.main.scrollY;
        }
    });
    
    scene.input.on('pointermove', (pointer) => {
        if (scene.currentPlayerTurret && scene.currentPlayerTurret.isAiming) {
            // Aiming mode
            scene.currentPlayerTurret.updateAim(pointer.worldX, pointer.worldY);
        } else if (isDragging) {
            // Camera panning mode
            const deltaX = pointer.x - dragStartX;
            const deltaY = pointer.y - dragStartY;
            
            scene.cameras.main.scrollX = cameraStartX - deltaX;
            scene.cameras.main.scrollY = cameraStartY - deltaY;
        }
    });
    
    scene.input.on('pointerup', (pointer) => {
        if (scene.currentPlayerTurret && scene.currentPlayerTurret.isAiming) {
            // Stop aiming and shoot
            const finalAngle = scene.currentPlayerTurret.stopAiming();
            console.log(`Shooting at angle: ${Phaser.Math.RadToDeg(finalAngle)} degrees`);
            
            // TODO: Launch projectile here
            
            scene.currentPlayerTurret = null;
        }
        
        // Stop camera dragging
        isDragging = false;
    });
    
    // Keyboard controls for camera
    const cursors = scene.input.keyboard.createCursorKeys();
    const wasd = scene.input.keyboard.addKeys('W,S,A,D');
    
    // Store for use in update loop
    scene.cameraControls = {
        cursors,
        wasd,
        isDragging: () => isDragging
    };
}

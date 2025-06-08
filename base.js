// base.js
// Player base (gun turret) graphics and logic for Rocket Wars

export function createGunTurret(scene, x, y, team = 'player1') {
    // Create a container to hold all turret parts
    const turret = scene.add.container(x, y);
    
    // Colors for different teams
    const teamColors = {
        player1: 0x4a90e2, // Blue
        player2: 0xe74c3c  // Red
    };
    
    const color = teamColors[team] || teamColors.player1;
    
    // Create the base (flat-bottomed platform)
    const base = scene.add.graphics();
    base.fillStyle(0x2c3e50, 1); // Dark gray
    
    // Draw the top semicircle (arc from -PI to 0)
    base.beginPath();
    base.arc(0, 0, 20, -Math.PI, 0, false);
    base.lineTo(-20, 0);
    base.closePath();
    base.fillPath();
    
    // Draw a rectangular block to fill the bottom gap
    base.fillRect(-20, 0, 40, 20); // 40px wide, 20px tall
    
    // Draw the outline
    base.lineStyle(3, color, 1);
    base.beginPath();
    base.arc(0, 0, 20, -Math.PI, 0, false);
    base.lineTo(-20, 0);
    base.lineTo(-20, 20);
    base.lineTo(20, 20);
    base.lineTo(20, 0);
    base.closePath();
    base.strokePath();
    
    // Create the turret body (smaller circle on top)
    const turretBody = scene.add.graphics();
    turretBody.fillStyle(color, 1);
    turretBody.fillCircle(0, -5, 12);
    turretBody.lineStyle(2, 0x2c3e50, 1);
    turretBody.strokeCircle(0, -5, 12);
    
    // Create the gun barrel (rectangle that will rotate)
    const barrel = scene.add.graphics();
    barrel.fillStyle(0x34495e, 1); // Darker gray
    barrel.fillRect(0, -3, 25, 6); // 25px long, 6px wide
    barrel.lineStyle(1, 0x2c3e50, 1);
    barrel.strokeRect(0, -3, 25, 6);
    
    // Position the barrel at the turret center
    barrel.x = 0;
    barrel.y = -5;
    
    // Add all parts to the container
    turret.add([base, turretBody, barrel]);
    
    // Store references for easy access
    turret.base = base;
    turret.turretBody = turretBody;
    turret.barrel = barrel;
    turret.team = team;
    
    // Method to rotate the gun barrel
    turret.setGunAngle = function(angleInDegrees) {
        // Clamp angle between -90 and 90 degrees (can't shoot backwards)
        const clampedAngle = Math.max(-90, Math.min(90, angleInDegrees));
        this.barrel.rotation = Phaser.Math.DegToRad(clampedAngle);
        return clampedAngle;
    };
    
    // Method to get the gun tip position (for launching projectiles)
    turret.getGunTipPosition = function() {
        const barrelLength = 25;
        const angle = this.barrel.rotation;
        const tipX = this.x + Math.cos(angle) * barrelLength;
        const tipY = this.y - 5 + Math.sin(angle) * barrelLength; // -5 for barrel Y offset
        return { x: tipX, y: tipY };
    };
    
    // Set initial angle (pointing slightly upward)
    turret.setGunAngle(-15);
    
    return turret;
}

export function placeTurretsOnBases(scene, flatBases, points) {
    const turrets = [];
    
    // Place one turret on the leftmost flat base (player 1 - blue)
    if (flatBases.length > 0) {
        const leftBase = flatBases[0];
        const leftPoint = points[leftBase.start];
        const leftTurret = createGunTurret(scene, leftPoint.x + 20, leftPoint.y - 25, 'player1');
        turrets.push(leftTurret);
    }
    
    // Place one turret on the rightmost flat base (player 2 - red)
    if (flatBases.length > 1) {
        const rightBase = flatBases[flatBases.length - 1];
        const rightPoint = points[rightBase.end];
        const rightTurret = createGunTurret(scene, rightPoint.x - 20, rightPoint.y - 25, 'player2');
        // Make player 2 turret face left initially
        rightTurret.setGunAngle(-165);
        turrets.push(rightTurret);
    }
    
    return turrets;
}

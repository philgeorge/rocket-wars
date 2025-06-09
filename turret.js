// turret.js
// Player gun turret graphics and logic for Rocket Wars

export function createGunTurret(scene, x, y, team = 'player1') {
    // Create a container to hold all turret parts
    const turret = scene.add.container(x, y);
    
    // Colors for different teams
    const teamColors = {
        player1: 0x4a90e2, // Blue
        player2: 0xf1c40f  // Yellow (changed from red to avoid confusion with aiming lines)
    };
    
    const color = teamColors[team] || teamColors.player1;
    
    // Create the base (flat-bottomed platform)
    const base = scene.add.graphics();
    base.fillStyle(0x5d6d7e, 1); // Medium gray (lighter for better contrast)
    
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
    turretBody.lineStyle(2, 0x5d6d7e, 1); // Use same medium gray for outline
    turretBody.strokeCircle(0, -5, 12);
    
    // Create the gun barrel (rectangle that will rotate)
    const barrel = scene.add.graphics();
    barrel.fillStyle(0x34495e, 1); // Darker gray for barrel (unchanged)
    barrel.fillRect(0, -3, 25, 6); // 25px long, 6px wide
    barrel.lineStyle(1, 0x5d6d7e, 1); // Use same medium gray for outline
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
    
    // Make the turret interactive (this works even with pointer-events: none on canvas)
    turret.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
    
    // Add aiming state tracking
    turret.isAiming = false;
    turret.aimingLine = null;
    turret.currentPower = 0.5; // Default to 50% power
    turret.aimTooltip = null; // Add tooltip reference

    // Method to create or update the aiming tooltip
    turret.createOrUpdateTooltip = function(angle, power, mouseX, mouseY) {
        if (!this.aimTooltip) {
            // Create tooltip container
            this.aimTooltip = scene.add.container(0, 0);
            
            // Create background rectangle
            const bg = scene.add.graphics();
            bg.fillStyle(0x000000, 0.8);
            bg.lineStyle(1, 0xffffff, 0.6);
            bg.fillRoundedRect(-40, -15, 80, 30, 5);
            bg.strokeRoundedRect(-40, -15, 80, 30, 5);
            
            // Create text
            const text = scene.add.text(0, 0, '', {
                fontSize: '12px',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0.5);
            
            this.aimTooltip.add([bg, text]);
            this.aimTooltip.text = text; // Store reference for updates
        }
        
        // Update tooltip content
        const angleDegrees = Math.round(Phaser.Math.RadToDeg(angle));
        const powerPercent = Math.round(power * 100);
        this.aimTooltip.text.setText(`${Math.abs(angleDegrees)}°\n${powerPercent}%`);
        
        // Position tooltip near mouse cursor but offset to avoid blocking view
        const offsetX = 30;
        const offsetY = -30;
        this.aimTooltip.x = mouseX + offsetX;
        this.aimTooltip.y = mouseY + offsetY;
        
        // Make sure tooltip stays visible
        this.aimTooltip.setVisible(true);
    };

    // Method to hide the tooltip
    turret.hideTooltip = function() {
        if (this.aimTooltip) {
            this.aimTooltip.setVisible(false);
        }
    };
    
    // Method to rotate the gun barrel
    turret.setGunAngle = function(angleInDegrees) {
        // Both turrets can aim from -180° to 0° (upper half-circle, left to right)
        const clampedAngle = Math.max(-180, Math.min(0, angleInDegrees));
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
    
    // Method to start aiming
    turret.startAiming = function() {
        this.isAiming = true;
        // Create aiming line graphics
        if (!this.aimingLine) {
            this.aimingLine = scene.add.graphics();
        }
    };
    
    // Method to update aim based on world coordinates
    turret.updateAim = function(worldX, worldY) {
        if (!this.isAiming) return;
        
        // Calculate angle from turret to target point
        const deltaX = worldX - this.x;
        const deltaY = worldY - (this.y - 5); // -5 for barrel Y offset
        const angleInRadians = Math.atan2(deltaY, deltaX);
        let angleInDegrees = Phaser.Math.RadToDeg(angleInRadians);
        
        // Calculate power based on distance from turret
        const distanceFromTurret = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const minPower = 0.2; // Minimum power (20%)
        const maxPower = 1.0; // Maximum power (100%)
        const minDistance = 50; // Minimum distance for minimum power
        const maxDistance = 300; // Distance for maximum power
        
        // Clamp distance and map to power range
        const clampedDistance = Math.max(minDistance, Math.min(maxDistance, distanceFromTurret));
        const power = minPower + (maxPower - minPower) * ((clampedDistance - minDistance) / (maxDistance - minDistance));
        
        // Store power for shooting
        this.currentPower = power;
        
        // Normalize angle to -180 to +180 range
        while (angleInDegrees > 180) angleInDegrees -= 360;
        while (angleInDegrees < -180) angleInDegrees += 360;
        
        // If angle is in bottom half (positive Y, meaning below turret), 
        // clamp to nearest valid angle based on which side of turret the mouse is on
        if (deltaY > 0) {
            // Mouse is below turret - snap to nearest edge based on X position
            if (deltaX <= 0) {
                // Mouse is on left side or directly below -> snap to -180° (left)
                angleInDegrees = -180;
            } else {
                // Mouse is on right side -> snap to 0° (right)  
                angleInDegrees = 0;
            }
        }
        
        // Set gun angle (with clamping to -180° to 0° range)
        const clampedAngle = this.setGunAngle(angleInDegrees);
        
        // Draw aiming line with length based on power
        this.aimingLine.clear();
        
        // Color intensity based on power (more red = more power)
        const powerColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0xffff00), // Yellow (low power)
            Phaser.Display.Color.ValueToColor(0xff4444), // Red (high power)
            100,
            Math.floor(power * 100)
        );
        const colorValue = Phaser.Display.Color.ObjectToColor(powerColor).color;
        
        this.aimingLine.lineStyle(3, colorValue, 0.9);
        
        const tipPos = this.getGunTipPosition();
        const minLineLength = 50;
        const maxLineLength = 200;
        const lineLength = minLineLength + (maxLineLength - minLineLength) * power;
        
        const lineEndX = tipPos.x + Math.cos(Phaser.Math.DegToRad(clampedAngle)) * lineLength;
        const lineEndY = tipPos.y + Math.sin(Phaser.Math.DegToRad(clampedAngle)) * lineLength;
        
        this.aimingLine.lineBetween(tipPos.x, tipPos.y, lineEndX, lineEndY);
        
        // Update tooltip with current angle and power (use clamped angle, same as aiming line)
        this.createOrUpdateTooltip(Phaser.Math.DegToRad(clampedAngle), power, worldX, worldY);
    };
    
    // Method to stop aiming
    turret.stopAiming = function() {
        this.isAiming = false;
        if (this.aimingLine) {
            this.aimingLine.clear();
        }
        this.hideTooltip(); // Hide tooltip on stop
        return {
            angle: this.barrel.rotation,
            power: this.currentPower || 0.5 // Default to 50% power if not set
        };
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
    
    // Place one turret on the rightmost flat base (player 2 - yellow)
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

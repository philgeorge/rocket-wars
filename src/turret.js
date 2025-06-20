// turret.js
// Player gun turret graphics and logic for Rocket Wars

import { getTeamColorHex, PLAYER_TEAMS } from './constants.js';

/**
 * Create a gun turret with interactive aiming capabilities
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {number} x - X position for the turret
 * @param {number} y - Y position for the turret
 * @param {string} [team='player1'] - Team identifier (player1, player2, etc.)
 * @returns {TurretContainer} The turret container with attached methods and properties
 */
export function createGunTurret(scene, x, y, team = 'player1') {
    // Create a container to hold all turret parts
    const turret = /** @type {TurretContainer} */ (scene.add.container(x, y));
    
    // Get team color from shared constants
    const color = getTeamColorHex(team);
    
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
    turret.tooltipTimer = null; // Add timer reference for delayed tooltip hiding

    // Method to lock tooltip position to current screen coordinates
    turret.lockTooltipPosition = function() {
        if (this.aimTooltip && this.aimTooltip.visible) {
            // Get current screen position before changing scroll factor
            const camera = scene.cameras.main;
            const currentScreenX = this.aimTooltip.x - camera.scrollX;
            const currentScreenY = this.aimTooltip.y - camera.scrollY;
            
            // Make tooltip stay fixed on screen regardless of camera movement
            this.aimTooltip.setScrollFactor(0);
            
            // Set position to maintain the same visual location on screen
            this.aimTooltip.x = currentScreenX;
            this.aimTooltip.y = currentScreenY;
        }
    };

    // Method to create or update the aiming tooltip
    turret.createOrUpdateTooltip = function(angle, power, mouseX, mouseY) {
        if (!this.aimTooltip) {
            // Create tooltip container
            this.aimTooltip = scene.add.container(0, 0);
            
            // Create background rectangle to match status panel style
            const bg = scene.add.graphics();
            bg.fillStyle(0x000000, 0.8);
            bg.lineStyle(2, 0xffffff, 0.6);
            bg.fillRoundedRect(-35, -25, 70, 50, 8);
            bg.strokeRoundedRect(-35, -25, 70, 50, 8);
            
            // Create text to match status panel style
            const text = scene.add.text(0, 0, '', {
                fontSize: '1rem',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0.5);
            
            this.aimTooltip.add([bg, text]);
            /** @type {any} */ (this.aimTooltip).text = text; // Store reference for updates
        }
        
        // Reset scroll factor to follow world coordinates (mouse position) while aiming
        this.aimTooltip.setScrollFactor(1);
        
        // Update tooltip content
        const angleDegrees = Phaser.Math.RadToDeg(angle);
        
        // Convert to 0-90° where 90° is straight up and 0° is horizontal
        let displayAngle;
        
        if (angleDegrees <= -90) {
            // Left side: -180° to -90° maps to 0° to 90°
            displayAngle = Math.round(angleDegrees + 180);
        } else {
            // Right side: -90° to 0° maps to 90° to 0°
            displayAngle = Math.round(Math.abs(angleDegrees + 90));
        }
        
        const powerPercent = Math.round(power * 100);
        /** @type {any} */ (this.aimTooltip).text.setText(`${displayAngle}°\n${powerPercent}%`);
        
        // Position tooltip near mouse cursor but offset to avoid blocking view
        const offsetX = 30;
        const offsetY = -30;
        this.aimTooltip.x = mouseX + offsetX;
        this.aimTooltip.y = mouseY + offsetY;
        
        // Make sure tooltip stays visible
        this.aimTooltip.setVisible(true);
    };

    // Method to hide the tooltip with optional delay and fade
    turret.hideTooltip = function(delayMs = 0, fadeMs = 0) {
        const turret = /** @type {TurretContainer} */ (this);
        if (turret.aimTooltip) {
            if (delayMs === 0 && fadeMs === 0) {
                // Immediate hide (for interruptions like clicking elsewhere)
                turret.aimTooltip.setVisible(false);
                // Clear any existing timers
                if (turret.tooltipTimer) {
                    turret.tooltipTimer.destroy();
                    turret.tooltipTimer = null;
                }
            } else {
                // Delayed hide with fade effect
                turret.tooltipTimer = scene.time.delayedCall(delayMs, () => {
                    if (turret.aimTooltip && turret.aimTooltip.visible) {
                        // Fade out over specified duration
                        scene.tweens.add({
                            targets: turret.aimTooltip,
                            alpha: 0,
                            duration: fadeMs,
                            ease: 'Power2',
                            onComplete: () => {
                                if (turret.aimTooltip) {
                                    turret.aimTooltip.setVisible(false);
                                    turret.aimTooltip.setAlpha(1); // Reset alpha for next use
                                }
                            }
                        });
                    }
                });
            }
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
        const turret = /** @type {TurretContainer} */ (this);
        if (!turret.isAiming) return;
        
        // Calculate angle from turret to target point
        const deltaX = worldX - turret.x;
        const deltaY = worldY - (turret.y - 5); // -5 for barrel Y offset
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
        turret.currentPower = power;
        
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
        const clampedAngle = turret.setGunAngle(angleInDegrees);
        
        // Draw aiming line with length based on power
        turret.aimingLine.clear();
        
        // Color intensity based on power (more red = more power)
        const powerColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0xffff00), // Yellow (low power)
            Phaser.Display.Color.ValueToColor(0xff4444), // Red (high power)
            100,
            Math.floor(power * 100)
        );
        const colorValue = Phaser.Display.Color.ObjectToColor(powerColor).color;
        
        turret.aimingLine.lineStyle(3, colorValue, 0.9);
        
        const tipPos = turret.getGunTipPosition();
        const minLineLength = 50;
        const maxLineLength = 200;
        const lineLength = minLineLength + (maxLineLength - minLineLength) * power;
        
        const lineEndX = tipPos.x + Math.cos(Phaser.Math.DegToRad(clampedAngle)) * lineLength;
        const lineEndY = tipPos.y + Math.sin(Phaser.Math.DegToRad(clampedAngle)) * lineLength;
        
        turret.aimingLine.lineBetween(tipPos.x, tipPos.y, lineEndX, lineEndY);
        
        // Update tooltip with current angle and power (use clamped angle, same as aiming line)
        turret.createOrUpdateTooltip(Phaser.Math.DegToRad(clampedAngle), power, worldX, worldY);
    };
    
    // Method to stop aiming
    turret.stopAiming = function() {
        const turret = /** @type {TurretContainer} */ (this);
        turret.isAiming = false;
        if (turret.aimingLine) {
            turret.aimingLine.clear();
        }
        // Lock tooltip position to current screen coordinates but don't start fade timer yet
        // Tooltip will fade when projectile finishes its flight
        turret.lockTooltipPosition();
        return {
            angle: turret.barrel.rotation,
            power: turret.currentPower || 0.5 // Default to 50% power if not set
        };
    };
    
    // Set initial angle (pointing slightly upward)
    turret.setGunAngle(-15);
    
    return turret;
}

/**
 * Place turrets randomly on flat bases in the landscape
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {Array<{start: number, end: number}>} flatBases - Array of flat base objects with start/end indices
 * @param {Array<{x: number, y: number}>} points - Array of landscape points
 * @param {number} [numPlayers=2] - Number of players/turrets to place
 * @returns {Array<TurretContainer>} Array of created turret objects
 */
export function placeTurretsOnBases(scene, flatBases, points, numPlayers = 2) {
    const turrets = [];
    
    // Ensure we don't try to place more turrets than we have bases or more than 4 players max
    const actualPlayers = Math.min(numPlayers, flatBases.length, 4);
    
    // Use shared player teams array
    const playerTeams = PLAYER_TEAMS;
    
    if (actualPlayers > 0 && flatBases.length > 0) {
        // Create a shuffled copy of flat bases for random selection
        const shuffledBases = [...flatBases];
        
        // Fisher-Yates shuffle algorithm
        for (let i = shuffledBases.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledBases[i], shuffledBases[j]] = [shuffledBases[j], shuffledBases[i]];
        }
        
        // Place turrets on randomly selected bases
        for (let playerIndex = 0; playerIndex < actualPlayers; playerIndex++) {
            const base = shuffledBases[playerIndex];
            const team = playerTeams[playerIndex] || `player${playerIndex + 1}`;
            
            // Calculate turret position at the center of the flat base
            const startPoint = points[base.start];
            const endPoint = points[base.end];
            const baseCenterX = (startPoint.x + endPoint.x) / 2;
            const baseCenterY = startPoint.y; // All points in flat base should have same Y
            
            // Add slight random offset within the base for visual variety
            const baseWidth = endPoint.x - startPoint.x;
            const offsetRange = Math.min(20, baseWidth * 0.3); // Max 20px or 30% of base width
            const randomOffset = (Math.random() - 0.5) * offsetRange;
            
            const turret = createGunTurret(scene, baseCenterX + randomOffset, baseCenterY - 25, team);
            
            // Set random initial gun angle for variety
            const randomAngle = -180 + Math.random() * 180; // -180° to 0°
            turret.setGunAngle(randomAngle);
            
            turrets.push(turret);
            
            console.log(`Placed ${team} turret on base ${flatBases.indexOf(base) + 1} at (${Math.round(baseCenterX + randomOffset)}, ${Math.round(baseCenterY - 25)})`);
        }
    }
    
    console.log(`Placed ${turrets.length} turrets for ${actualPlayers} players on random bases`);
    return turrets;
}

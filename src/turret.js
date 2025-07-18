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
    
    // Create slightly darker version of team color for fills
    const colorObj = Phaser.Display.Color.ValueToColor(color);
    const darkerColor = Phaser.Display.Color.ObjectToColor({
        r: Math.max(0, colorObj.red - 40),
        g: Math.max(0, colorObj.green - 40), 
        b: Math.max(0, colorObj.blue - 40)
    }).color;
    
    // Create the base (flat-bottomed platform)  
    const base = scene.add.graphics();
    drawTurretBase(base, darkerColor, 1, color, 100);
    
    // Create the turret body (smaller circle on top)
    const turretBody = scene.add.graphics();
    drawTurretBody(turretBody, darkerColor, 1, color, 100);
    
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
    turret.minDistance = 0; // Will be calculated when aiming starts
    turret.maxDistance = 0; // Will be calculated when aiming starts
    
    // Add keyboard aiming state properties
    turret.isKeyboardAiming = false;
    turret.keyboardAngle = -45; // Default angle: 45 degrees upward
    turret.keyboardPower = 0.5; // Default power: 50%

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
    turret.createOrUpdateTooltip = function(angle, power, aimLineEndX, aimLineEndY) {
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
        
        // Reset scroll factor to follow world coordinates (aiming line tip position) while aiming
        this.aimTooltip.setScrollFactor(1);
        
        // Update tooltip content
        const angleDegrees = Phaser.Math.RadToDeg(angle);
        
        // Convert to 0-90° where 90° is straight up and 0° is horizontal
        let displayAngle;
        
        if (angleDegrees <= -90) {
            // Left side: -180° to -90° maps to 0° to 90°
            displayAngle = Math.round(angleDegrees + 180);
        } else {
            // Right side: -90° to 0° maps to 90° to 0° (abs converts negative angles to positive elevation angles)
            displayAngle = Math.round(Math.abs(angleDegrees));
        }
        
        const powerPercent = Math.round(power * 100);
        /** @type {any} */ (this.aimTooltip).text.setText(`${displayAngle}°\n${powerPercent}%`);
        
        // Position tooltip away from aiming line tip, offset towards screen center for touch usability
        const camera = scene.cameras.main;
        const screenCenterX = camera.scrollX + camera.width / 2;
        const screenCenterY = camera.scrollY + camera.height / 2;
        
        // Calculate direction from aiming line tip towards screen center
        const towardsCenterX = screenCenterX - aimLineEndX;
        const towardsCenterY = screenCenterY - aimLineEndY;
        const towardsCenterLength = Math.sqrt(towardsCenterX * towardsCenterX + towardsCenterY * towardsCenterY);
        
        // Normalize the direction vector
        let directionX = 0;
        let directionY = -1; // Default to upward if we're at screen center
        if (towardsCenterLength > 0) {
            directionX = towardsCenterX / towardsCenterLength;
            directionY = towardsCenterY / towardsCenterLength;
        }
        
        // Position tooltip 150px away from aiming line tip in the direction towards screen center
        const tooltipDistance = 150;
        let tooltipX = aimLineEndX + (directionX * tooltipDistance);
        let tooltipY = aimLineEndY + (directionY * tooltipDistance);
        
        // Ensure tooltip stays within viewport bounds with padding
        const padding = 50;
        const viewportLeft = camera.scrollX + padding;
        const viewportRight = camera.scrollX + camera.width - padding;
        const viewportTop = camera.scrollY + padding;
        const viewportBottom = camera.scrollY + camera.height - padding;
        
        tooltipX = Phaser.Math.Clamp(tooltipX, viewportLeft, viewportRight);
        tooltipY = Phaser.Math.Clamp(tooltipY, viewportTop, viewportBottom);
        
        this.aimTooltip.x = tooltipX;
        this.aimTooltip.y = tooltipY;
        
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
        
        // Calculate responsive distances once when aiming starts (based on current screen size)
        const camera = scene.cameras.main;
        const screenSize = Math.min(camera.width, camera.height);
        this.minDistance = Math.max(40, screenSize * 0.05);  // At least 40px, or 5% of screen
        this.maxDistance = Math.max(120, screenSize * 0.3); // At least 120px, or 30% of screen
        console.log(`🔫 Turret aiming on screenSize=${screenSize} with responsive distances: min=${this.minDistance}, max=${this.maxDistance}`);
        
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
        
        // Calculate power based on distance from turret using pre-calculated responsive distances
        const distanceFromTurret = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const minPower = 0.1; // Minimum power (10%)
        const maxPower = 1.0; // Maximum power (100%)
        
        // Use the responsive distances calculated when aiming started
        const clampedDistance = Math.max(turret.minDistance, Math.min(turret.maxDistance, distanceFromTurret));
        const power = minPower + (maxPower - minPower) * ((clampedDistance - turret.minDistance) / (turret.maxDistance - turret.minDistance));
        
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
        
        // Use the same responsive distances for line length as power calculation
        const lineLength = turret.minDistance + (turret.maxDistance - turret.minDistance) * power;
        
        const lineEndX = tipPos.x + Math.cos(Phaser.Math.DegToRad(clampedAngle)) * lineLength;
        const lineEndY = tipPos.y + Math.sin(Phaser.Math.DegToRad(clampedAngle)) * lineLength;
        
        turret.aimingLine.lineBetween(tipPos.x, tipPos.y, lineEndX, lineEndY);
        
        // Update tooltip with current angle and power positioned at the tip of the aiming line
        turret.createOrUpdateTooltip(Phaser.Math.DegToRad(clampedAngle), power, lineEndX, lineEndY);
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
    
    // Method to update health visual indicator
    turret.updateHealthDisplay = function(healthPercent) {
        // Clamp health percentage to 0-100 range
        const clampedHealth = Math.max(0, Math.min(100, healthPercent));
        
        console.log(`🎯 Updating turret health display: ${clampedHealth}% (team: ${this.team})`);
        console.log(`🎯 Before redraw - base exists: ${!!this.base}, body exists: ${!!this.turretBody}`);
        console.log(`🎯 Colors - darkerColor: ${darkerColor.toString(16)}, color: ${color.toString(16)}`);
        
        // Redraw base and turret body with vertical fill based on health
        drawTurretBase(this.base, darkerColor, 1, color, clampedHealth);
        drawTurretBody(this.turretBody, darkerColor, 1, color, clampedHealth);
        
        console.log(`🎯 After redraw - health display updated for ${this.team}`);
    };

    // Set initial angle (pointing slightly upward)
    turret.setGunAngle(-15);
    
    return turret;
}

/**
 * Place turrets on specified bases using player setup data
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {Array<{start: number, end: number}>} flatBases - Array of flat base objects with start/end indices
 * @param {Array<{x: number, y: number}>} points - Array of landscape points
 * @param {Array} playerData - Array of player data from setup stage (default: empty array)
 * @returns {Array<TurretContainer>} Array of created turret objects
 */
export function placeTurretsOnBases(scene, flatBases, points, playerData = []) {
    const turrets = [];
    
    console.log(`🎯 Placing turrets for ${playerData.length} players using setup data...`);
    
    if (playerData.length > 0 && flatBases.length > 0) {
        // Place turrets based on player setup data
        playerData.forEach((player, playerIndex) => {
            if (player.baseIndex !== null && player.baseIndex < flatBases.length) {
                const base = flatBases[player.baseIndex];
                
                // Calculate turret position at the center of the selected base
                const startPoint = points[base.start];
                const endPoint = points[base.end];
                const baseCenterX = (startPoint.x + endPoint.x) / 2;
                const baseCenterY = startPoint.y; // All points in flat base should have same Y
                
                // Add slight random offset within the base for visual variety
                const baseWidth = endPoint.x - startPoint.x;
                const offsetRange = Math.min(20, baseWidth * 0.3); // Max 20px or 30% of base width
                const randomOffset = (Math.random() - 0.5) * offsetRange;
                
                const turret = createGunTurret(scene, baseCenterX + randomOffset, baseCenterY - 25, player.team);
                
                // Store player name and data reference on turret
                turret.playerName = player.name;
                turret.playerId = player.id;
                turret.playerData = player;
                
                // Set random initial gun angle for variety
                const randomAngle = -180 + Math.random() * 180; // -180° to 0°
                turret.setGunAngle(randomAngle);
                
                // Update player data with turret reference
                player.turret = turret;
                
                turrets.push(turret);
                
                console.log(`✅ Placed ${player.name}'s (${player.team}) turret on base ${player.baseIndex} at (${Math.round(baseCenterX + randomOffset)}, ${Math.round(baseCenterY - 25)})`);
            } else {
                console.warn(`⚠️ Player ${player.name} has invalid base index: ${player.baseIndex}`);
            }
        });
    } else {
        console.warn(`⚠️ No player data provided or no flat bases available`);
    }
    
    console.log(`🏁 Placed ${turrets.length} turrets for ${playerData.length} players using their selected bases`);
    return turrets;
}

/**
 * Draw the turret base shape with specified fill and outline
 * @param {Phaser.GameObjects.Graphics} graphics - The graphics object to draw on
 * @param {number} fillColor - The fill color
 * @param {number} fillAlpha - The fill alpha (0.0-1.0)
 * @param {number} outlineColor - The outline color
 * @param {number} [healthPercent=100] - Health percentage (0-100) for segmented health bars
 */
function drawTurretBase(graphics, fillColor, fillAlpha, outlineColor, healthPercent = 100) {
    graphics.clear();
    
    console.log(`🏗️ Drawing turret base with health: ${healthPercent}%`);
    
    // Fill the base shape
    graphics.fillStyle(fillColor, fillAlpha);
    
    // Always fill the semicircular top completely
    graphics.beginPath();
    graphics.arc(0, 0, 20, -Math.PI, 0, false);
    graphics.lineTo(-20, 0);
    graphics.closePath();
    graphics.fillPath();
    
    // Draw segmented health bars in the rectangular bottom portion
    const numSegments = 5;
    const segmentWidth = 6; // Width of each health bar segment
    const segmentHeight = 12; // Height of each health bar segment
    const segmentSpacing = 2; // Space between segments
    const totalWidth = (numSegments * segmentWidth) + ((numSegments - 1) * segmentSpacing);
    const startX = -totalWidth / 2; // Center the segments horizontally
    const segmentY = 4; // Position segments in the middle of the rectangle (y=0 to y=20)
    
    // Calculate how many segments to show based on health percentage
    let activeSegments = 0;
    if (healthPercent > 0) {
        if (healthPercent <= 25) activeSegments = 1;
        else if (healthPercent <= 50) activeSegments = 2;
        else if (healthPercent <= 75) activeSegments = 3;
        else if (healthPercent < 100) activeSegments = 4;
        else activeSegments = 5;
    }
    
    console.log(`🏗️ Health segments: ${activeSegments}/${numSegments} (${healthPercent}%)`);
    
    // Draw each segment
    for (let i = 0; i < numSegments; i++) {
        const segmentX = startX + (i * (segmentWidth + segmentSpacing));
        
        if (i < activeSegments) {
            // Active segment - fill with team color
            graphics.fillStyle(fillColor, fillAlpha);
            graphics.fillRect(segmentX, segmentY, segmentWidth, segmentHeight);
        } else {
            // Inactive segment - draw empty outline
            graphics.lineStyle(1, outlineColor, 0.3);
            graphics.strokeRect(segmentX, segmentY, segmentWidth, segmentHeight);
        }
    }
    
    // Draw the outline (always full outline)
    graphics.lineStyle(3, outlineColor, 1);
    graphics.beginPath();
    graphics.arc(0, 0, 20, -Math.PI, 0, false);
    graphics.lineTo(-20, 0);
    graphics.lineTo(-20, 20);
    graphics.lineTo(20, 20);
    graphics.lineTo(20, 0);
    graphics.closePath();
    graphics.strokePath();
}

/**
 * Draw the turret body circle with specified fill and outline
 * @param {Phaser.GameObjects.Graphics} graphics - The graphics object to draw on
 * @param {number} fillColor - The fill color
 * @param {number} fillAlpha - The fill alpha (0.0-1.0)
 * @param {number} outlineColor - The outline color
 * @param {number} [healthPercent=100] - Health percentage (0-100) for vertical fill
 */
function drawTurretBody(graphics, fillColor, fillAlpha, outlineColor, healthPercent = 100) {
    graphics.clear();
    
    console.log(`🏗️ Drawing turret body with health: ${healthPercent}%`);
    
    // Fill the turret body circle with health-based vertical fill
    graphics.fillStyle(fillColor, fillAlpha);
    
    if (healthPercent > 0) {
        // Calculate fill height for the circle (diameter is 24, radius is 12)
        const circleRadius = 12;
        const circleCenterY = -5;
        const circleTop = circleCenterY - circleRadius; // -17
        const circleBottom = circleCenterY + circleRadius; // 7
        const totalHeight = circleRadius * 2; // 24
        
        const fillHeight = (healthPercent / 100) * totalHeight;
        const fillTop = circleBottom - fillHeight; // Start from bottom, work up
        
        console.log(`🏗️ Body fill calculation: fillHeight=${fillHeight}, fillTop=${fillTop}, totalHeight=${totalHeight}`);
        
        // Draw a partial circle fill from bottom up
        if (fillHeight >= totalHeight) {
            // Full circle
            console.log(`🏗️ Drawing full circle`);
            graphics.fillCircle(0, circleCenterY, circleRadius);
        } else {
            // Partial circle - draw a custom path
            console.log(`🏗️ Drawing partial circle`);
            // Calculate the angle where the fill line intersects the circle
            const yOffset = fillTop - circleCenterY; // Distance from center to fill line
            
            if (yOffset < circleRadius) {
                // Calculate intersection points
                const angle = Math.acos(Math.max(-1, Math.min(1, yOffset / circleRadius)));
                const x1 = -Math.sin(angle) * circleRadius;
                const x2 = Math.sin(angle) * circleRadius;
                
                console.log(`🏗️ Circle intersection: yOffset=${yOffset}, angle=${angle}, x1=${x1}, x2=${x2}`);
                
                // Draw the filled portion
                graphics.beginPath();
                graphics.arc(0, circleCenterY, circleRadius, Math.PI - angle, angle, false);
                graphics.lineTo(x1, fillTop);
                graphics.lineTo(x2, fillTop);
                graphics.closePath();
                graphics.fillPath();
            } else {
                console.log(`🏗️ Fill line above circle, no fill`);
            }
        }
    } else {
        console.log(`🏗️ No health remaining, no body fill`);
    }
    
    // Draw the outline (always full circle outline)
    graphics.lineStyle(2, outlineColor, 1);
    graphics.strokeCircle(0, -5, 12);
}

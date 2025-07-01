// Global type declarations for Phaser.js
// This file helps VS Code understand Phaser types when using the CDN version

/// <reference types="phaser" />

// Make Phaser available globally
declare global {
  const Phaser: typeof import('phaser');
  
  // Custom Turret interface extending Phaser Container
  interface TurretContainer extends Phaser.GameObjects.Container {
    // Turret component references
    base: Phaser.GameObjects.Graphics;
    turretBody: Phaser.GameObjects.Graphics;
    barrel: Phaser.GameObjects.Graphics;
    team: string;
    
    // Aiming state properties
    isAiming: boolean;
    aimingLine: Phaser.GameObjects.Graphics | null;
    currentPower: number;
    aimTooltip: (Phaser.GameObjects.Container & { text?: Phaser.GameObjects.Text }) | null;
    tooltipTimer: Phaser.Time.TimerEvent | null;
    
    // Responsive aiming distances (calculated once when aiming starts)
    minDistance: number;
    maxDistance: number;
    
    // Player data properties (added when turret is placed on base)
    playerName?: string;
    playerId?: string;
    playerData?: any;
    
    // Custom methods
    createOrUpdateTooltip(angle: number, power: number, mouseX: number, mouseY: number): void;
    hideTooltip(delayMs?: number, fadeMs?: number): void;
    lockTooltipPosition(): void;
    setGunAngle(angleInDegrees: number): number;
    getGunTipPosition(): { x: number; y: number };
    startAiming(): void;
    updateAim(worldX: number, worldY: number): void;
    stopAiming(): { angle: number; power: number };
    updateHealthDisplay(healthPercent: number): void;
  }
}

// Export empty object to make this a module
export {};

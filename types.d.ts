// Global type declarations for Phaser.js
// This file helps VS Code understand Phaser types when using the CDN version

/// <reference types="phaser" />

// Make Phaser available globally
declare global {
  const Phaser: typeof import('phaser');
  
  // Game state interfaces
  interface WindState {
    current: number; // Current wind value (-100 to +100)
    variation: number; // Wind variation percentage (0-100%)
  }
  
  interface PlayerState {
    health: number; // Player health (0-100)
    kills: number; // Number of kills
    deaths: number; // Number of deaths
    baseIndex?: number | null; // Current base index (null if eliminated/not placed)
  }
  
  interface GameState {
    // Environment settings
    wind: WindState;
    gravity: number;
    numPlayers: number;
    
    // Rounds and turns tracking
    currentRound: number;
    maxRounds: number;
    currentPlayerIndex: number; // 0-based index into playersAlive array
    playersAlive: number[]; // Array of player numbers still in the game
    turnTimeLimit: number; // Turn time limit in seconds
    turnStartTime: number | null; // Timestamp when current turn began
    hasPlayerFiredThisTurn: boolean; // Prevent multiple shots per turn
    turnTimer: any; // Timer ID for countdown
    lastRemainingTime: number | null; // Last remaining time when timer was stopped
    
    // Teleport state management
    teleportMode: boolean; // True when current player is in teleport mode
    teleportPlayerNum: number | null; // Player number who initiated teleport
    
    // Dynamic player data (player1, player2, etc.)
    [key: `player${number}`]: PlayerState;
  }
  
  interface PlayerData {
    id?: string; // Player identifier (player1, player2, etc.)
    name: string; // User-entered name
    color?: string; // Player color
    team?: string; // Team identifier for colors
    baseIndex?: number | null; // Index of chosen flat base
    basePosition?: { x: number; y: number }; // Calculated base center position
    health?: number; // Player health
    turret?: TurretContainer | null; // Turret object reference
  }
  
  interface FlatBase {
    start: number; // Starting point index in landscape
    end: number; // Ending point index in landscape
  }
  
  interface LandscapeData {
    points: Array<{ x: number; y: number }>;
    flatBases: FlatBase[];
    chunks?: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      destroyed: boolean;
      falling: boolean;
      fallSpeed: number;
      originalY: number;
      graphics?: any;
    }>;
  }
  
  // UI Panel interfaces
  interface EnvironmentPanel extends Phaser.GameObjects.Container {
    updateDisplay: (gameState: GameState) => void;
    updateTimer: (gameState: GameState) => void;
    updateTeleportButton: (gameState: GameState, scene: Scene) => void;
    textElements: any;
    teleportButton: any;
  }
  
  interface PlayerStatsPanel extends Phaser.GameObjects.Container {
    updateDisplay: (gameState: GameState) => void;
    playerElements: any[];
  }
  
  interface ResultsPanel extends Phaser.GameObjects.Container {
    updateDisplay: (gameState: GameState) => void;
    textElements: any;
  }
  
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
    
    // Keyboard aiming state properties
    isKeyboardAiming: boolean;
    keyboardAngle: number;
    keyboardPower: number;
    keyHoldState?: {
        leftHeld: boolean;
        rightHeld: boolean;
        upHeld: boolean;
        downHeld: boolean;
        leftHoldTime: number;
        rightHoldTime: number;
        upHoldTime: number;
        downHoldTime: number;
        lastUpdateTime: number;
    };
    
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
    startKeyboardAiming(): void;
    drawAimingLineAndTooltip(angle: number, power: number, isKeyboardMode?: boolean): void;
    updateAim(worldX: number, worldY: number): void;
    stopAiming(): { angle: number; power: number };
    updateHealthDisplay(healthPercent: number): void;
  }
  
  // Scene extension for custom properties
  interface Scene extends Phaser.Scene {
    // Game state and lifecycle
    gameState?: GameState;
    gameEnded?: boolean;
    playerData?: PlayerData[];
    
    // Game objects and landscape
    turrets?: TurretContainer[];
    currentPlayerTurret?: TurretContainer | null;
    landscapeData?: LandscapeData;
    
    // UI panels
    environmentPanel?: EnvironmentPanel;
    playerStatsPanel?: PlayerStatsPanel;
    resultsPanel?: ResultsPanel;
    
    // Teleport state management
    activeBaseSelectionCleanup?: (() => void) | null;
    
    // Callback functions
    onShoot?: (turret: TurretContainer, shootData: { angle: number; power: number }) => void;
    startPlayerAiming?: (isKeyboardMode: boolean) => boolean;
    stopAimingAndShoot?: (isKeyboardMode: boolean) => void;
    handleTurnTimeout?: () => void;
  // Unified turn progression helper
  progressTurn?: (reason: 'timeout' | 'projectile' | 'teleport' | 'manual', opts?: { delayMs?: number }) => void;
  }
}

// Export empty object to make this a module
export {};

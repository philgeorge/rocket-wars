// baseSelection.js
// Base selection stage logic for Rocket Wars

import { createGunTurret } from './turret.js';
import { createBaseSelectionPanel, hideBaseSelectionPanel, positionBaseSelectionPanel } from './ui/index.js';
import { getTeamColorCSS, TEAM_COLORS, getTeamColorName } from './constants.js';
import { getCurrentPlayer } from './turnManager.js';

/**
 * Base selection stage state management
 * @typedef {Object} SetupState
 * @property {number} currentPlayerIndex - Current player being processed (0-based)
 * @property {Array} players - Array of player data objects
 * @property {Array<number>} availableBases - Array of unused flat base indices
 * @property {boolean} isComplete - Whether all players have completed base selection
 */

/**
 * Player data structure
 * @typedef {Object} PlayerData
 * @property {string} id - Player identifier (player1, player2, etc.)
 * @property {string} name - User-entered name (max 10 chars)
 * @property {string} team - Team identifier for colors
 * @property {number|null} baseIndex - Index of chosen flat base
 * @property {number} health - Starting health
 * @property {Object|null} turret - Will hold turret object reference
 */

/**
 * Initialize the base selection stage using Phaser panels
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {Object} gameConfig - Game configuration from form
 * @param {Array} flatBases - Array of available flat base locations
 * @returns {Promise<{players: Array<PlayerData>, turrets: Array}>} Promise that resolves with player data and turrets when base selection is complete
 */
export function initializeBaseSelection(scene, gameConfig, flatBases) {
    console.log('🎮 Starting Phaser-based base selection stage...');
    
    // Camera controls remain enabled since we're using Phaser panels now
    console.log('🎮 Camera controls remain enabled for base selection');
    
    return new Promise((resolve) => {
        // Initialize player data structures
        const players = [];
        for (let i = 1; i <= gameConfig.numPlayers; i++) {
            const playerKey = `player${i}`;
            /** @type {PlayerData} */
            const playerData = {
                id: playerKey,
                name: gameConfig.playerNames?.[playerKey] || `Player ${i}`, // Use name from game config
                team: playerKey,
                baseIndex: null,
                health: 100,
                turret: null
            };
            players.push(playerData);
        }
        
        console.log('🎮 Player data initialized with names from game config:', players.map(p => ({ id: p.id, name: p.name })));
        
        // Initialize base selection logic (no need to create panel upfront)
        startBaseSelection(scene, players, flatBases, resolve);
    });
}

/**
 * Start the base selection process using Phaser panels
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Array} players - Array of player data
 * @param {Array} flatBases - Array of available flat base locations
 * @param {Function} resolve - Promise resolve function
 */
function startBaseSelection(scene, players, flatBases, resolve) {
    const sceneAny = /** @type {any} */ (scene);
    const landscapePoints = sceneAny.landscapeData?.points;
    if (!landscapePoints) {
        console.error('❌ No landscape points available in scene');
        return;
    }
    
    let currentPlayerIndex = 0;
    let availableBases = flatBases.map((_, index) => index);
    let setupTurrets = [];
    
    function showBaseSelection(playerIndex) {
        const player = players[playerIndex];
        
        console.log(`🎯 Starting base selection for ${player.name} (${playerIndex + 1}/${players.length})`);
        
        // Use the shared single-player base selection logic
        startSinglePlayerBaseSelection(scene, player, flatBases, availableBases, landscapePoints, {
            onBaseSelected: (baseIndex, basePosition) => {
                console.log(`🎯 Player ${player.name} selected base ${baseIndex}`);
                
                // Store selection in player data
                player.baseIndex = baseIndex;
                player.basePosition = basePosition;
                
                // Create permanent turret
                const turretX = basePosition.x;
                const turretY = basePosition.y - 20;
                const turret = createGunTurret(scene, turretX, turretY, player.team);
                
                player.turret = turret;
                setupTurrets.push(turret);
                
                console.log(`🏭 Placed turret for ${player.name} at (${turretX}, ${turretY})`);
                
                // Remove selected base from available list
                availableBases = availableBases.filter(index => index !== baseIndex);
                
                // Move to next player or complete setup
                currentPlayerIndex++;
                if (currentPlayerIndex < players.length) {
                    showBaseSelection(currentPlayerIndex);
                } else {
                    completeSetup();
                }
            },
            onCancelled: () => {
                console.log('🚫 Base selection cancelled - this should not happen in initial setup');
                // In initial setup, cancellation shouldn't happen, but we could handle it
            },
            isTeleportMode: false
        });
    }
    
    function completeSetup() {
        console.log('🎯 Phaser-based base selection complete!', players);
        console.log('🏭 Turrets created during base selection:', setupTurrets.length);
        
        // Resolve the promise with player data and existing turrets
        resolve({ players: players, turrets: setupTurrets });
    }
    
    // Handle window resize for panel positioning (shared logic will handle this)
    
    // Start with first player
    showBaseSelection(0);
}

/**
 * Initialize base selection for teleportation (single player)
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {Object} gameState - Current game state
 * @param {Array} flatBases - Array of available flat base locations
 * @param {Array} existingTurrets - Array of existing turrets to exclude their bases
 * @returns {Promise<{baseIndex: number, basePosition: Object}>} Promise that resolves with selected base data
 */
export function initializeTeleportBaseSelection(scene, gameState, flatBases, existingTurrets) {
    console.log('🔄 Starting teleport base selection...');
    
    return new Promise((resolve, reject) => {
        const sceneAny = /** @type {any} */ (scene);
        const landscapePoints = sceneAny.landscapeData?.points;
        if (!landscapePoints) {
            console.error('❌ No landscape points available in scene');
            reject(new Error('No landscape points available'));
            return;
        }
        
        // Get current player info
        const currentPlayerNum = getCurrentPlayer(gameState);
        const currentPlayerKey = `player${currentPlayerNum}`;
        
        // Create mock player object to reuse existing base selection logic
        const mockPlayer = {
            name: `Player ${currentPlayerNum}`,
            team: currentPlayerKey
        };
        
        // Calculate available bases (exclude occupied ones except current player's)
        const currentTurret = existingTurrets.find(turret => turret.team === currentPlayerKey);
        const occupiedBaseIndices = existingTurrets
            .filter(turret => turret !== currentTurret)
            .map(turret => {
                return flatBases.findIndex(base => {
                    const baseCenter = calculateBaseCenterFromPoints(base, landscapePoints);
                    const distance = Phaser.Math.Distance.Between(turret.x, turret.y + 20, baseCenter.x, baseCenter.y);
                    return distance < 50;
                });
            })
            .filter(index => index !== -1);
        
        const availableBases = flatBases
            .map((_, index) => index)
            .filter(index => !occupiedBaseIndices.includes(index));
        
        console.log(`🔄 Available bases for teleport: ${availableBases.length}/${flatBases.length}`);
        
        if (availableBases.length === 0) {
            console.log('🚫 No available bases for teleportation');
            reject(new Error('No available bases for teleportation'));
            return;
        }
        
        // Reuse the existing base selection logic with teleport-specific callbacks
        startSinglePlayerBaseSelection(scene, mockPlayer, flatBases, availableBases, landscapePoints, {
            onBaseSelected: (baseIndex, basePosition) => {
                console.log(`✅ Teleport base selection complete: base ${baseIndex}`);
                resolve({ baseIndex, basePosition });
            },
            onCancelled: () => {
                console.log('🚫 Teleport base selection cancelled');
                reject(new Error('Teleport cancelled by user'));
            },
            isTeleportMode: true
        });
    });
}

/**
 * Reusable single-player base selection logic
 * @param {Phaser.Scene} scene - The Phaser scene
 * @param {Object} player - Player data object
 * @param {Array} flatBases - Array of flat base locations
 * @param {Array} availableBases - Array of available base indices
 * @param {Array} landscapePoints - Landscape points for calculations
 * @param {Object} callbacks - Callback functions for completion/cancellation
 */
function startSinglePlayerBaseSelection(scene, player, flatBases, availableBases, landscapePoints, callbacks) {
    // Shared state management
    let baseHighlights = [];
    let currentPanel = null;
    let keyboardSelectedBaseIndex = -1;
    let previewTurret = null;
    let keyboardHandlers = [];
    let isSelectionActive = true;
    
    // Create and show panel
    currentPanel = createBaseSelectionPanel(scene, player, 0, 1);
    positionBaseSelectionPanel(currentPanel, scene.cameras.main.width);
    
    // Show base highlights using existing function
    showBaseHighlights();
    
    // Set up handlers using existing functions
    setupBaseSelectionHandlers();
    setupKeyboardHandlers();
    
    // Handle ESC key for cancellation
    const escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
        if (isSelectionActive) {
            console.log('🚫 Base selection cancelled via ESC');
            isSelectionActive = false;
            cleanupSelection();
            callbacks.onCancelled();
        }
    });
    keyboardHandlers.push(escKey);
    
    function showBaseHighlights() {
        // Clear any existing highlights
        hideBaseHighlights();
        
        // Get player color (reuse existing logic)
        const playerColor = getTeamColorCSS(player.team);
        const playerColorHex = parseInt(playerColor.replace('#', ''), 16);
        
        // Create highlights for each available base
        availableBases.forEach(baseIndex => {
            const base = flatBases[baseIndex];
            if (!base) return;
            
            const baseCenter = calculateBaseCenterFromPoints(base, landscapePoints);
            
            // Create highlight circle (reuse existing graphics logic)
            const highlight = scene.add.graphics();
            highlight.lineStyle(4, playerColorHex, 0.8);
            highlight.fillStyle(playerColorHex, 0.2);
            highlight.fillCircle(baseCenter.x, baseCenter.y - 25, 30);
            highlight.strokeCircle(baseCenter.x, baseCenter.y - 25, 30);
            
            // Make it interactive (reuse existing logic)
            const hitArea = new Phaser.Geom.Circle(baseCenter.x, baseCenter.y - 25, 35);
            highlight.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
            highlight.input.cursor = 'pointer';
            highlight.setDepth(500);
            
            baseHighlights.push(highlight);
            console.log(`✨ Created highlight for base ${baseIndex} at (${baseCenter.x}, ${baseCenter.y})`);
        });
    }
    
    function hideBaseHighlights() {
        baseHighlights.forEach(highlight => {
            if (highlight && highlight.scene) {
                highlight.off('pointerdown');
                highlight.off('pointerover');
                highlight.off('pointerout');
                highlight.destroy();
            }
        });
        baseHighlights = [];
    }
    
    function setupBaseSelectionHandlers() {
        availableBases.forEach((baseIndex, highlightIndex) => {
            const highlight = baseHighlights[highlightIndex];
            if (!highlight) return;
            
            let isHovering = false;
            let hoverTimeout = null;
            
            const clickHandler = () => {
                if (!isSelectionActive) return;
                
                console.log(`🎯 Player ${player.name} selected base ${baseIndex} via CLICK`);
                
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                
                clearPreviewTurret();
                completeSelection(baseIndex);
            };
            
            const hoverHandler = () => {
                if (!isSelectionActive || isHovering) return;
                
                isHovering = true;
                
                if (keyboardSelectedBaseIndex === -1) {
                    if (hoverTimeout) clearTimeout(hoverTimeout);
                    
                    hoverTimeout = setTimeout(() => {
                        if (keyboardSelectedBaseIndex === -1 && isHovering && isSelectionActive) {
                            clearPreviewTurret();
                            createPreviewTurret(baseIndex);
                        }
                        hoverTimeout = null;
                    }, 50);
                }
            };
            
            const hoverOutHandler = () => {
                isHovering = false;
                
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                
                if (keyboardSelectedBaseIndex === -1) {
                    clearPreviewTurret();
                }
            };
            
            // Reuse existing event handler pattern
            highlight.on('pointerdown', clickHandler);
            highlight.on('pointerover', hoverHandler);
            highlight.on('pointerout', hoverOutHandler);
        });
    }
    
    function setupKeyboardHandlers() {
        const keyboard = scene.input.keyboard;
        
        // Tab key handler - cycle through bases (reuse existing logic)
        const tabKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        tabKey.on('down', () => {
            if (!isSelectionActive) return;
            cycleToNextBase();
        });
        
        // Enter key handler - confirm selection (reuse existing logic)
        const enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enterKey.on('down', () => {
            if (!isSelectionActive) return;
            confirmKeyboardSelection();
        });
        
        keyboardHandlers.push(tabKey, enterKey);
    }
    
    function cycleToNextBase() {
        if (availableBases.length === 0) return;
        
        // Reuse existing cycling logic
        const currentIndex = availableBases.findIndex(baseIndex => baseIndex === keyboardSelectedBaseIndex);
        const nextIndex = (currentIndex + 1) % availableBases.length;
        keyboardSelectedBaseIndex = availableBases[nextIndex];
        
        console.log(`⌨️ Cycling to base ${keyboardSelectedBaseIndex}`);
        
        // Move camera to show the selected base (reuse existing logic)
        const basePosition = calculateBaseCenterFromPoints(flatBases[keyboardSelectedBaseIndex], landscapePoints);
        scene.cameras.main.pan(basePosition.x, basePosition.y, 500, 'Power2');
        
        // Update preview turret
        clearPreviewTurret();
        createPreviewTurret(keyboardSelectedBaseIndex);
    }
    
    function confirmKeyboardSelection() {
        if (keyboardSelectedBaseIndex === -1) {
            console.log('⌨️ No base selected via keyboard');
            return;
        }
        
        console.log(`⌨️ Player ${player.name} confirmed base ${keyboardSelectedBaseIndex} via keyboard`);
        clearPreviewTurret();
        completeSelection(keyboardSelectedBaseIndex);
    }
    
    function createPreviewTurret(baseIndex) {
        const basePosition = calculateBaseCenterFromPoints(flatBases[baseIndex], landscapePoints);
        const turretX = basePosition.x;
        const turretY = basePosition.y - 20;
        
        // Reuse existing turret creation logic
        previewTurret = createGunTurret(scene, turretX, turretY, player.team);
        previewTurret.setAlpha(0.7);
        previewTurret.disableInteractive();
        previewTurret.setDepth(100);
    }
    
    function clearPreviewTurret() {
        if (previewTurret) {
            previewTurret.destroy();
            previewTurret = null;
        }
    }
    
    function completeSelection(baseIndex) {
        if (!isSelectionActive) return;
        
        isSelectionActive = false;
        const basePosition = calculateBaseCenterFromPoints(flatBases[baseIndex], landscapePoints);
        
        // Cleanup
        cleanupSelection();
        
        // Call the appropriate callback
        callbacks.onBaseSelected(baseIndex, basePosition);
    }
    
    function cleanupSelection() {
        // Clear highlights (reuse existing cleanup logic)
        hideBaseHighlights();
        
        // Clear keyboard handlers
        keyboardHandlers.forEach(key => {
            if (key && key.destroy) {
                key.destroy();
            }
        });
        keyboardHandlers = [];
        
        // Clear preview turret
        clearPreviewTurret();
        
        // Hide panel
        if (currentPanel) {
            hideBaseSelectionPanel(currentPanel);
            currentPanel = null;
        }
        
        // Reset selection state
        keyboardSelectedBaseIndex = -1;
    }
}

/**
 * Helper function to calculate base center from landscape points (shared version)
 * @param {Object} base - Base object with start/end indices
 * @param {Array} landscapePoints - Array of landscape points
 * @returns {Object} Base center position {x, y}
 */
function calculateBaseCenterFromPoints(base, landscapePoints) {
    const startPoint = landscapePoints[base.start];
    const endPoint = landscapePoints[base.end];
    
    return {
        x: (startPoint.x + endPoint.x) / 2,
        y: startPoint.y
    };
}

/**
 * Get player color hex value
 * @param {string} playerKey - Player key (player1, player2, etc.)
 * @returns {number} Hex color value
 */
function getPlayerColorHex(playerKey) {
    return TEAM_COLORS[playerKey]?.hex || TEAM_COLORS.player1.hex;
}

/**
 * Get player color name
 * @param {string} playerKey - Player key (player1, player2, etc.)
 * @returns {string} Color name
 */
function getPlayerColorName(playerKey) {
    return TEAM_COLORS[playerKey]?.name || TEAM_COLORS.player1.name;
}


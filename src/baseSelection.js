// baseSelection.js
// Base selection stage logic for Rocket Wars

import { createGunTurret } from './turret.js';
import { createBaseSelectionPanel, hideBaseSelectionPanel, positionBaseSelectionPanel } from './ui/index.js';
import { getTeamColorCSS } from './constants.js';

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
    let baseHighlights = [];
    let baseClickHandlers = [];
    let currentPanel = null; // Track the current panel
    let keyboardSelectedBaseIndex = -1; // Track keyboard selection (-1 means no selection)
    let previewTurret = null; // Preview turret for keyboard selection
    let keyboardHandlers = []; // Track keyboard event handlers for cleanup
    
    function showBaseSelection(playerIndex) {
        const player = players[playerIndex];
        
        // Hide the previous panel if it exists
        if (currentPanel) {
            hideBaseSelectionPanel(currentPanel);
        }
        
        // Clear previous keyboard selection and preview turret
        keyboardSelectedBaseIndex = -1;
        clearPreviewTurret();
        
        // Create a new panel for this player
        currentPanel = createBaseSelectionPanel(scene, player, playerIndex, players.length);
        
        // Show base highlights and enable base selection
        showBaseHighlights(player);
        setupBaseSelectionHandlers(player, playerIndex);
        setupKeyboardHandlers(player, playerIndex);
    }
    
    function showBaseHighlights(currentPlayer) {
        console.log('🎯 Showing base highlights for available bases:', availableBases);
        
        // Clear any existing highlights
        hideBaseHighlights();
        
        // Get current player's color
        const playerColor = getTeamColorCSS(currentPlayer.team);
        const playerColorHex = parseInt(playerColor.replace('#', ''), 16);
        
        // Create highlights for each available base
        availableBases.forEach(baseIndex => {
            const base = flatBases[baseIndex];
            if (!base) return;
            
            // Calculate base center position from landscape points
            const baseCenter = calculateBaseCenter(base);
            
            // Create a highlight circle using the player's color
            const highlight = scene.add.graphics();
            highlight.lineStyle(4, playerColorHex, 0.8);
            highlight.fillStyle(playerColorHex, 0.2);
            highlight.fillCircle(baseCenter.x, baseCenter.y - 25, 30);
            highlight.strokeCircle(baseCenter.x, baseCenter.y - 25, 30);
            
            // Make it interactive with a slightly larger hit area for better click detection
            const hitArea = new Phaser.Geom.Circle(baseCenter.x, baseCenter.y - 25, 35);
            highlight.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
            
            // Ensure the highlight can receive input events
            highlight.input.cursor = 'pointer';
            
            // Set depth above preview turrets to ensure proper event handling
            highlight.setDepth(500);
            
            // Store reference to the highlight
            baseHighlights.push(highlight);
            
            console.log(`✨ Created ${playerColor} highlight for base ${baseIndex} at (${baseCenter.x}, ${baseCenter.y})`);
        });
    }
    
    function hideBaseHighlights() {
        console.log('🧹 Hiding base highlights and clearing event handlers');
        
        // Remove all highlights and their event handlers
        baseHighlights.forEach(highlight => {
            if (highlight && highlight.scene) {
                // Remove all event listeners before destroying
                highlight.off('pointerdown');
                highlight.off('pointerover');
                highlight.off('pointerout');
                highlight.destroy();
            }
        });
        baseHighlights = [];
        
        // Clear click handlers array
        baseClickHandlers = [];
    }
    
    function calculateBaseCenter(base) {
        // Calculate center point of the base from landscape points
        if (!landscapePoints || !landscapePoints[base.start]) {
            console.error('❌ No landscape points available for base calculation');
            return { x: 0, y: 0 };
        }
        
        const startPoint = landscapePoints[base.start];
        const endPoint = landscapePoints[base.end];
        
        return {
            x: (startPoint.x + endPoint.x) / 2,
            y: startPoint.y // Use the flat Y position
        };
    }
    
    function setupBaseSelectionHandlers(player, playerIndex) {
        console.log('🎯 Setting up base selection for player:', player.name);
        
        // Add click and hover handlers to all available base highlights
        availableBases.forEach((baseIndex, highlightIndex) => {
            const highlight = baseHighlights[highlightIndex];
            if (!highlight) return;
            
            let isHovering = false; // Track hover state for this specific highlight
            let hoverTimeout = null; // Track timeout for delayed hover effects
            
            const clickHandler = () => {
                console.log(`🎯 Player ${player.name} selected base ${baseIndex} via CLICK`);
                
                // Clear any pending hover effects
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                
                // Immediately clear any preview turret to avoid conflicts
                clearPreviewTurret();
                
                // Store the selected base in player data
                player.baseIndex = baseIndex;
                player.basePosition = calculateBaseCenter(flatBases[baseIndex]);
                
                // Create turret immediately so next players can see it
                const turretX = player.basePosition.x;
                const turretY = player.basePosition.y - 20;
                const turret = createGunTurret(scene, turretX, turretY, player.team);
                
                // Store turret reference and add to setup list
                player.turret = turret;
                setupTurrets.push(turret);
                
                console.log(`🏭 Placed turret for ${player.name} at (${turretX}, ${turretY})`);
                
                // Remove this base from available list
                availableBases = availableBases.filter(index => index !== baseIndex);
                
                // Clear keyboard handlers
                clearKeyboardHandlers();
                
                // Hide all highlights
                hideBaseHighlights();
                
                // Move to next player or complete base selection
                currentPlayerIndex++;
                if (currentPlayerIndex < players.length) {
                    showBaseSelection(currentPlayerIndex);
                } else {
                    completeSetup();
                }
            };
            
            const hoverHandler = () => {
                if (isHovering) return; // Already hovering, don't recreate
                
                console.log(`🎯 Player ${player.name} hovering over base ${baseIndex}`);
                isHovering = true;
                
                // Only create preview if there's no keyboard selection active
                if (keyboardSelectedBaseIndex === -1) {
                    // Clear any existing timeout
                    if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                    }
                    
                    // Small delay to prevent conflicts with rapid mouse movements
                    hoverTimeout = setTimeout(() => {
                        // Double-check conditions after delay
                        if (keyboardSelectedBaseIndex === -1 && isHovering) {
                            // Clear any existing preview turret
                            clearPreviewTurret();
                            
                            // Create preview turret at the hovered base
                            const basePosition = calculateBaseCenter(flatBases[baseIndex]);
                            const turretX = basePosition.x;
                            const turretY = basePosition.y - 20;
                            previewTurret = createGunTurret(scene, turretX, turretY, player.team);
                            
                            // Make preview turret slightly transparent to indicate it's temporary
                            previewTurret.setAlpha(0.7);
                            
                            // Disable interactivity to prevent mouse event interference
                            previewTurret.disableInteractive();
                            
                            // Set depth below highlights to avoid interference
                            previewTurret.setDepth(100);
                        }
                        hoverTimeout = null;
                    }, 50); // 50ms delay
                }
            };
            
            const hoverOutHandler = () => {
                console.log(`🎯 Player ${player.name} stopped hovering over base ${baseIndex}`);
                isHovering = false;
                
                // Clear any pending hover timeout
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                
                // Only clear preview turret if it's from mouse hover (not keyboard selection)
                if (keyboardSelectedBaseIndex === -1) {
                    clearPreviewTurret();
                }
            };
            
            // Add event handlers with proper order - click first
            highlight.on('pointerdown', clickHandler);
            highlight.on('pointerover', hoverHandler);
            highlight.on('pointerout', hoverOutHandler);
            
            // Store handler references for cleanup
            baseClickHandlers.push({
                target: highlight,
                callback: clickHandler
            });
        });
    }
    
    function clearPreviewTurret() {
        if (previewTurret) {
            console.log('🧹 Clearing preview turret');
            try {
                if (previewTurret.destroy) {
                    previewTurret.destroy();
                }
            } catch (error) {
                console.warn('Error destroying preview turret:', error);
            }
            previewTurret = null;
        }
    }
    
    function setupKeyboardHandlers(player, playerIndex) {
        console.log('⌨️ Setting up keyboard handlers for player:', player.name);
        console.log('⌨️ Available bases for keyboard selection:', availableBases);
        
        // Clear any existing keyboard handlers
        clearKeyboardHandlers();
        
        // Ensure the canvas has focus to capture keyboard events
        if (scene.game.canvas) {
            scene.game.canvas.focus();
            console.log('⌨️ Canvas focused for keyboard input');
        }
        
        // Use Phaser's input system to capture keyboard events
        const keyboard = scene.input.keyboard;
        
        // Tab key handler - cycle through available bases
        const tabKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        tabKey.on('down', (event) => {
            console.log('⌨️ Tab key pressed!');
            cycleToNextBase(player);
        });
        
        // Enter key handler - confirm selection
        const enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enterKey.on('down', (event) => {
            console.log('⌨️ Enter key pressed!');
            confirmKeyboardSelection(player, playerIndex);
        });
        
        // Store keys for cleanup
        keyboardHandlers.push(tabKey, enterKey);
        
        console.log('⌨️ Keyboard handlers set up using Phaser input system');
    }
    
    function clearKeyboardHandlers() {
        keyboardHandlers.forEach(key => {
            if (key && key.destroy) {
                key.destroy();
            }
        });
        keyboardHandlers = [];
    }
    
    function cycleToNextBase(player) {
        console.log('⌨️ cycleToNextBase called for player:', player.name);
        console.log('⌨️ Current available bases:', availableBases);
        
        if (availableBases.length === 0) {
            console.log('⌨️ No available bases to cycle through');
            return;
        }
        
        // Get next base index
        const currentIndex = availableBases.findIndex(baseIndex => baseIndex === keyboardSelectedBaseIndex);
        const nextIndex = (currentIndex + 1) % availableBases.length;
        keyboardSelectedBaseIndex = availableBases[nextIndex];
        
        console.log(`⌨️ Cycling to base ${keyboardSelectedBaseIndex} for ${player.name} (index ${nextIndex})`);
        
        // Move camera to show the selected base
        const basePosition = calculateBaseCenter(flatBases[keyboardSelectedBaseIndex]);
        console.log(`⌨️ Moving camera to base position:`, basePosition);
        scene.cameras.main.pan(basePosition.x, basePosition.y, 500, 'Power2');
        
        // Clear any existing preview turret (including from mouse hover)
        clearPreviewTurret();
        
        // Create preview turret at the selected base
        const turretX = basePosition.x;
        const turretY = basePosition.y - 20;
        previewTurret = createGunTurret(scene, turretX, turretY, player.team);
        
        // Make preview turret slightly transparent to indicate it's temporary
        previewTurret.setAlpha(0.7);
        
        // Disable interactivity to prevent mouse event interference
        previewTurret.disableInteractive();
        
        // Set depth below highlights to avoid interference
        previewTurret.setDepth(100);
        
        console.log(`🎯 Preview turret created for ${player.name} at base ${keyboardSelectedBaseIndex}`);
    }
    
    function confirmKeyboardSelection(player, playerIndex) {
        if (keyboardSelectedBaseIndex === -1) {
            console.log('⌨️ No base selected via keyboard, ignoring Enter key');
            return;
        }
        
        console.log(`⌨️ Player ${player.name} confirmed base ${keyboardSelectedBaseIndex} via keyboard`);
        
        // Store the selected base in player data
        player.baseIndex = keyboardSelectedBaseIndex;
        player.basePosition = calculateBaseCenter(flatBases[keyboardSelectedBaseIndex]);
        
        // Convert preview turret to actual turret
        if (previewTurret) {
            previewTurret.setAlpha(1.0); // Make it fully opaque
            player.turret = previewTurret;
            setupTurrets.push(previewTurret);
            previewTurret = null; // Clear reference since it's now permanent
        }
        
        console.log(`🏭 Confirmed turret for ${player.name} at (${player.basePosition.x}, ${player.basePosition.y})`);
        
        // Remove this base from available list
        availableBases = availableBases.filter(index => index !== keyboardSelectedBaseIndex);
        
        // Clear keyboard selection
        keyboardSelectedBaseIndex = -1;
        
        // Hide all highlights
        hideBaseHighlights();
        
        // Clear keyboard handlers
        clearKeyboardHandlers();
        
        // Move to next player or complete base selection
        currentPlayerIndex++;
        if (currentPlayerIndex < players.length) {
            showBaseSelection(currentPlayerIndex);
        } else {
            completeSetup();
        }
    }
    
    function completeSetup() {
        console.log('🎯 Phaser-based base selection complete!', players);
        console.log('🏭 Turrets created during base selection:', setupTurrets.length);
        
        // Cleanup any remaining highlights
        hideBaseHighlights();
        
        // Clear keyboard handlers
        clearKeyboardHandlers();
        
        // Clear any preview turret
        clearPreviewTurret();
        
        // Hide the current panel
        if (currentPanel) {
            hideBaseSelectionPanel(currentPanel);
        }
        
        // Resolve the promise with player data and existing turrets
        resolve({ players: players, turrets: setupTurrets });
    }
    
    // Handle window resize for panel positioning
    const handleResize = () => {
        if (currentPanel) {
            positionBaseSelectionPanel(currentPanel, scene.cameras.main.width);
        }
    };
    window.addEventListener('resize', handleResize);
    
    // Start with first player
    showBaseSelection(0);
}


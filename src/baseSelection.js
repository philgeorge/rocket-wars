// baseSelection.js
// Base selection stage logic for Rocket Wars

import { createGunTurret } from './turret.js';
import { createBaseSelectionPanel, hideBaseSelectionPanel, positionBaseSelectionPanel } from './baseSelectionPanel.js';
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
    
    function showBaseSelection(playerIndex) {
        const player = players[playerIndex];
        
        // Hide the previous panel if it exists
        if (currentPanel) {
            hideBaseSelectionPanel(currentPanel);
        }
        
        // Create a new panel for this player
        currentPanel = createBaseSelectionPanel(scene, player, playerIndex, players.length);
        
        // Show base highlights and enable base selection
        showBaseHighlights(player);
        setupBaseSelectionHandlers(player, playerIndex);
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
            
            // Make it interactive
            const hitArea = new Phaser.Geom.Circle(baseCenter.x, baseCenter.y - 25, 30);
            highlight.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
            
            // Store reference to the highlight
            baseHighlights.push(highlight);
            
            console.log(`✨ Created ${playerColor} highlight for base ${baseIndex} at (${baseCenter.x}, ${baseCenter.y})`);
        });
    }
    
    function hideBaseHighlights() {
        // Remove all highlights and their event handlers
        baseHighlights.forEach(highlight => {
            if (highlight && highlight.scene) {
                highlight.destroy();
            }
        });
        baseHighlights = [];
        
        // Clear click handlers
        baseClickHandlers.forEach(handler => {
            if (handler.target && handler.target.scene) {
                handler.target.off('pointerdown', handler.callback);
            }
        });
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
        
        // Add click handlers to all available base highlights
        availableBases.forEach((baseIndex, highlightIndex) => {
            const highlight = baseHighlights[highlightIndex];
            if (!highlight) return;
            
            const clickHandler = () => {
                console.log(`🎯 Player ${player.name} selected base ${baseIndex}`);
                
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
                
                console.log(`� Placed turret for ${player.name} at (${turretX}, ${turretY})`);
                
                // Remove this base from available list
                availableBases = availableBases.filter(index => index !== baseIndex);
                
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
            
            // Add click handler
            highlight.on('pointerdown', clickHandler);
            
            // Store handler reference for cleanup
            baseClickHandlers.push({
                target: highlight,
                callback: clickHandler
            });
        });
    }
    
    function completeSetup() {
        console.log('🎯 Phaser-based base selection complete!', players);
        console.log('🏭 Turrets created during base selection:', setupTurrets.length);
        
        // Cleanup any remaining highlights
        hideBaseHighlights();
        
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


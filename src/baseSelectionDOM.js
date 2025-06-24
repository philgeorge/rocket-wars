// baseSelectionDOM.js
// DOM-based base selection UI to avoid Phaser input conflicts

import { createGunTurret } from './turret.js';
import { getTeamColorCSS, getTeamColorName } from './constants.js';

/**
 * Create a DOM-based base selection overlay
 * @param {Array} playerData - Array of player data objects
 * @param {Array} flatBases - Array of available flat base locations
 * @param {Phaser.Scene} scene - The Phaser scene for base highlighting
 * @param {Function} onComplete - Callback when base selection is complete
 */
export function createDOMBaseSelectionOverlay(playerData, flatBases, scene, onComplete) {
    console.log('🖼️ Setting up DOM-based base selection panel...');
    
    // Get landscape points from scene - cast scene to any to avoid TypeScript errors
    const sceneAny = /** @type {any} */ (scene);
    const landscapePoints = sceneAny.landscapeData?.points;
    if (!landscapePoints) {
        console.error('❌ No landscape points available in scene');
        return;
    }
    
    // Array to store turrets created during base selection
    let setupTurrets = [];
    
    // Get references to the existing HTML elements
    const panel = document.getElementById('base-selection-panel');
    const titleElement = document.getElementById('base-selection-title');
    const baseSection = document.getElementById('base-section');
    const baseColourText = document.getElementById('base-colour');
    
    if (!panel || !titleElement || !baseSection || !baseColourText) {
        console.error('❌ Required base selection panel elements not found in DOM');
        return;
    }
    
    let currentPlayerIndex = 0;
    let availableBases = flatBases.map((_, index) => index); // Track available base indices
    let currentPlayerState = 'name'; // 'name' or 'base'
    
    function showBaseSelection(playerIndex) {
        const player = playerData[playerIndex];
        currentPlayerState = 'base'; // Skip name entry, go straight to base selection
        
        // Show the panel
        panel.style.display = 'block';
        
        updatePanelContent(player, playerIndex);
        
        // Show base highlights and enable base selection immediately
        showBaseHighlights();
        setupBaseSelection(player, playerIndex);
    }
    
    function updatePanelContent(player, playerIndex) {
        // Get the player's assigned color
        const playerColor = getTeamColorCSS(player.team);
        const playerColorName = getTeamColorName(player.team);
        
        // Update panel styling to match player color
        panel.style.borderColor = playerColor;
        titleElement.style.color = playerColor;
        
        const progressText = `(${playerIndex + 1} of ${playerData.length})`;
        
        // Update text content for base selection
        titleElement.textContent = `${progressText} ${player.name.toUpperCase()} - ${playerColorName.toUpperCase()} BASE SELECTION`;
        
        // Show base section (name section is no longer used)
        baseSection.style.display = 'block';
        
        // Update help text with player's color name
        baseColourText.textContent = playerColorName.toLowerCase();
    }
    
    // Set up event handlers once at initialization
    function setupEventHandlers() {
        // No name input handlers needed anymore since names are set in game setup
        console.log('🎮 Base selection handlers ready');
    }
    
    // Store base highlights for cleanup
    let baseHighlights = [];
    let baseClickHandlers = [];
    
    function showBaseHighlights() {
        console.log('🎯 Showing base highlights for available bases:', availableBases);
        
        // Clear any existing highlights
        hideBaseHighlights();
        
        // Get current player's color
        const currentPlayer = playerData[currentPlayerIndex];
        const playerColor = getTeamColorCSS(currentPlayer.team);
        // Convert CSS color to hex number for Phaser
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
    
    function setupBaseSelection(player, playerIndex) {
        console.log('🎯 Setting up base selection for player:', player.name);
        
        // Add click handlers to all available base highlights
        availableBases.forEach((baseIndex, highlightIndex) => {
            const highlight = baseHighlights[highlightIndex];
            if (!highlight) return;
            
            const clickHandler = () => {
                console.log(`🎯 Player ${player.name} selected base ${baseIndex}`);
                
                // Store the selected base in player data
                player.baseIndex = baseIndex;  // Use baseIndex to match turret placement expectations
                player.basePosition = calculateBaseCenter(flatBases[baseIndex]);
                
                // ✨ NEW: Create turret immediately so next players can see it
                const turretX = player.basePosition.x;
                const turretY = player.basePosition.y - 20; // Position so bottom of turret sits on base surface
                const turret = createGunTurret(scene, turretX, turretY, player.team);
                
                // Store turret reference and add to setup list
                player.turret = turret;
                setupTurrets.push(turret);
                
                console.log(`🏭 Placed turret for ${player.name} at (${turretX}, ${turretY})`);
                
                // Remove this base from available list
                availableBases = availableBases.filter(index => index !== baseIndex);
                
                // Hide all highlights
                hideBaseHighlights();
                
                // Move to next player or complete base selection
                currentPlayerIndex++;
                if (currentPlayerIndex < playerData.length) {
                    // Disable camera controls for next player's name input
                    const sceneAny = /** @type {any} */ (scene);
                    if (sceneAny.cameraControls && sceneAny.cameraControls.disable) {
                        sceneAny.cameraControls.disable();
                        console.log('🎮 Camera controls disabled for next player name input');
                    }
                    
                    // Select base for next player
                    showBaseSelection(currentPlayerIndex);
                } else {
                    // All players done - keep camera controls enabled for combat
                    console.log('🎮 Keeping camera controls enabled for combat phase');
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
        console.log('🎯 DOM-based base selection complete!', playerData);
        console.log('🏭 Turrets created during base selection:', setupTurrets.length);
        
        // Cleanup any remaining highlights
        hideBaseHighlights();
        
        // Restore canvas focusability
        const canvasElements = document.querySelectorAll('canvas');
        canvasElements.forEach(canvas => {
            canvas.tabIndex = 0; // Make canvas focusable again
        });
        console.log('✅ Canvas elements restored to focusable');
        
        // Hide panel instead of removing it
        panel.style.display = 'none';
        
        // Call completion callback with player data and existing turrets
        onComplete(playerData, setupTurrets);
    }
    
    // Set up event handlers once
    setupEventHandlers();
    
    // Start with first player
    showBaseSelection(0);
}

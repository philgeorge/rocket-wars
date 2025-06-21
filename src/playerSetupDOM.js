// playerSetupDOM.js
// DOM-based player setup UI to avoid Phaser input conflicts

import { createGunTurret } from './turret.js';
import { loadPlayerNames, savePlayerName } from './storage.js';
import { getTeamColorCSS, getTeamColorName } from './constants.js';

/**
 * Create a DOM-based player setup overlay with base selection
 * @param {Array} playerData - Array of player data objects
 * @param {Array} flatBases - Array of available flat base locations
 * @param {Phaser.Scene} scene - The Phaser scene for base highlighting
 * @param {Function} onComplete - Callback when setup is complete
 */
export function createDOMPlayerSetupOverlay(playerData, flatBases, scene, onComplete) {
    console.log('🖼️ Setting up DOM-based player setup panel...');
    
    // Get landscape points from scene - cast scene to any to avoid TypeScript errors
    const sceneAny = /** @type {any} */ (scene);
    const landscapePoints = sceneAny.landscapeData?.points;
    if (!landscapePoints) {
        console.error('❌ No landscape points available in scene');
        return;
    }
    
    // Array to store turrets created during setup
    let setupTurrets = [];
    
    // Get references to the existing HTML elements
    const panel = document.getElementById('player-setup-panel');
    const titleElement = document.getElementById('setup-title');
    const subtitleElement = document.getElementById('setup-subtitle');
    const progressElement = document.getElementById('setup-progress');
    const nameSection = document.getElementById('name-section');
    const baseSection = document.getElementById('base-section');
    const nameInput = /** @type {HTMLInputElement} */ (document.getElementById('player-name-input'));
    const nameReadyButton = document.getElementById('name-ready-button');
    const baseInstructions = document.getElementById('base-instructions');
    const backButton = document.getElementById('back-button');
    const baseHelpText = document.getElementById('base-help-text');
    
    if (!panel || !titleElement || !subtitleElement || !progressElement || 
        !nameSection || !baseSection || !nameInput || !nameReadyButton || 
        !baseInstructions || !backButton || !baseHelpText) {
        console.error('❌ Required setup panel elements not found in DOM');
        return;
    }
    
    let currentPlayerIndex = 0;
    let availableBases = flatBases.map((_, index) => index); // Track available base indices
    let currentPlayerState = 'name'; // 'name' or 'base'
    
    function showPlayerSetup(playerIndex) {
        const player = playerData[playerIndex];
        currentPlayerState = 'name';
        
        // Show the panel
        panel.style.display = 'block';
        
        updatePanelContent(player, playerIndex);
        focusNameInput();
    }
    
    function updatePanelContent(player, playerIndex) {
        // Get the player's assigned color
        const playerColor = getTeamColorCSS(player.team);
        const playerColorName = getTeamColorName(player.team);
        
        // Update panel styling to match player color
        panel.style.borderColor = playerColor;
        titleElement.style.color = playerColor;
        nameInput.style.borderColor = playerColor;
        nameReadyButton.style.background = playerColor;
        nameReadyButton.style.borderColor = playerColor;
        
        // Update content based on current state
        if (currentPlayerState === 'name') {
            // Load saved player names
            const savedNames = loadPlayerNames();
            const savedName = savedNames[player.id] || '';
            
            // Update text content
            titleElement.textContent = 'PLAYER SETUP';
            subtitleElement.textContent = `${playerColorName.toUpperCase()} PLAYER: Enter your name`;
            progressElement.textContent = `Player ${playerIndex + 1} of ${playerData.length}`;
            
            // Set input value and show name section
            nameInput.value = savedName;
            nameSection.style.display = 'block';
            baseSection.style.display = 'none';
            
        } else if (currentPlayerState === 'base') {
            // Update text content
            titleElement.textContent = 'BASE SELECTION';
            subtitleElement.textContent = `${player.name} (${playerColorName}): Click a highlighted base to place your turret`;
            progressElement.textContent = `Player ${playerIndex + 1} of ${playerData.length}`;
            
            // Show base section and hide name section
            nameSection.style.display = 'none';
            baseSection.style.display = 'block';
            
            // Update help text with player's color name
            baseHelpText.textContent = `or click a ${playerColorName.toLowerCase()} highlighted base`;
        }
    }
    
    function focusNameInput() {
        setTimeout(() => {
            // Remove focus from any Phaser canvas elements
            const canvasElements = document.querySelectorAll('canvas');
            canvasElements.forEach(canvas => {
                if (canvas.tabIndex >= 0) {
                    canvas.tabIndex = -1; // Make canvas non-focusable temporarily
                }
            });
            
            // Focus the input field
            nameInput.focus();
            nameInput.select(); // Also select any existing text
            
            console.log('🎯 Input focused, activeElement:', document.activeElement);
        }, 200);
    }
    
    // Set up event handlers once at initialization
    function setupEventHandlers() {
        // Name input handlers
        nameInput.addEventListener('input', (e) => {
            const target = /** @type {HTMLInputElement} */ (e.target);
            console.log('📝 Input event - current value:', target.value);
        });
        
        nameInput.addEventListener('keydown', (e) => {
            const keyEvent = /** @type {KeyboardEvent} */ (e);
            console.log('🔤 Key pressed in name input:', keyEvent.key);
            e.stopPropagation();
            
            if (keyEvent.key === 'Enter') {
                e.preventDefault();
                handleNameComplete();
            }
        });
        
        nameInput.addEventListener('keyup', (e) => {
            e.stopPropagation();
        });
        
        // Name ready button handler
        nameReadyButton.addEventListener('click', handleNameComplete);
        
        // Back button handler
        backButton.addEventListener('click', handleBackToName);
    }
    
    function handleNameComplete() {
        const player = playerData[currentPlayerIndex];
        const enteredName = nameInput.value.trim();
        
        if (enteredName.length === 0) {
            player.name = `Player ${currentPlayerIndex + 1}`;
        } else {
            player.name = enteredName;
            // Save the entered name to localStorage
            savePlayerName(player.id, enteredName);
            console.log(`💾 Saved name "${enteredName}" for ${player.id}`);
        }
        
        console.log(`✅ Player ${currentPlayerIndex + 1} name set to: "${player.name}"`);
        
        // Re-enable camera controls for base selection phase
        const sceneAny = /** @type {any} */ (scene);
        if (sceneAny.cameraControls && sceneAny.cameraControls.enable) {
            sceneAny.cameraControls.enable();
            console.log('🎮 Camera controls enabled for base selection');
        }
        
        // Move to base selection phase
        currentPlayerState = 'base';
        updatePanelContent(player, currentPlayerIndex);
        
        // Show base highlights and enable base selection
        showBaseHighlights();
        setupBaseSelection(player, currentPlayerIndex);
    }
    
    function handleBackToName() {
        // Disable camera controls when going back to name input
        const sceneAny = /** @type {any} */ (scene);
        if (sceneAny.cameraControls && sceneAny.cameraControls.disable) {
            sceneAny.cameraControls.disable();
            console.log('🎮 Camera controls disabled for name input');
        }
        
        // Go back to name input
        currentPlayerState = 'name';
        const player = playerData[currentPlayerIndex];
        updatePanelContent(player, currentPlayerIndex);
        focusNameInput();
        
        // Hide base highlights
        hideBaseHighlights();
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
                
                // Move to next player or complete setup
                currentPlayerIndex++;
                if (currentPlayerIndex < playerData.length) {
                    // Disable camera controls for next player's name input
                    const sceneAny = /** @type {any} */ (scene);
                    if (sceneAny.cameraControls && sceneAny.cameraControls.disable) {
                        sceneAny.cameraControls.disable();
                        console.log('🎮 Camera controls disabled for next player name input');
                    }
                    
                    // Setup next player
                    showPlayerSetup(currentPlayerIndex);
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
        console.log('🎯 DOM-based player setup complete!', playerData);
        console.log('🏭 Turrets created during setup:', setupTurrets.length);
        
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
    showPlayerSetup(0);
}

// playerSetupDOM.js
// DOM-based player setup UI to avoid Phaser input conflicts

/**
 * Create a DOM-based player setup overlay with base selection
 * @param {Array} playerData - Array of player data objects
 * @param {Array} flatBases - Array of available flat base locations
 * @param {Phaser.Scene} scene - The Phaser scene for base highlighting
 * @param {Function} onComplete - Callback when setup is complete
 */
export function createDOMPlayerSetupOverlay(playerData, flatBases, scene, onComplete) {
    console.log('🖼️ Creating DOM-based player setup overlay...');
    
    // Get landscape points from scene - cast scene to any to avoid TypeScript errors
    const sceneAny = /** @type {any} */ (scene);
    const landscapePoints = sceneAny.landscapeData?.points;
    if (!landscapePoints) {
        console.error('❌ No landscape points available in scene');
        return;
    }
    
    // Create overlay container - make it transparent to mouse events except for the panel
    const overlay = document.createElement('div');
    overlay.id = 'player-setup-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        z-index: 1000;
        pointer-events: none;
        font-family: 'Courier New', monospace;
        color: white;
    `;
    
    // Create setup panel - positioned at top, allows pointer events
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.95);
        border: 3px solid #00ff00;
        border-radius: 12px;
        padding: 20px;
        width: 400px;
        text-align: center;
        pointer-events: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
    `;
    
    let currentPlayerIndex = 0;
    let availableBases = flatBases.map((_, index) => index); // Track available base indices
    let currentPlayerState = 'name'; // 'name' or 'base'
    
    function showPlayerSetup(playerIndex) {
        const player = playerData[playerIndex];
        currentPlayerState = 'name';
        
        updatePanelContent(player, playerIndex);
        setupEventHandlers(player, playerIndex);
    }
    
    function updatePanelContent(player, playerIndex) {
        if (currentPlayerState === 'name') {
            panel.innerHTML = `
                <h2 style="color: #00ff00; margin-bottom: 15px;">PLAYER SETUP</h2>
                <p style="color: #ffffff; margin-bottom: 15px;">
                    ${player.team.toUpperCase()}: Enter your name
                </p>
                <p style="color: #cccccc; margin-bottom: 15px;">
                    Player ${playerIndex + 1} of ${playerData.length}
                </p>
                <input type="text" id="player-name-input" 
                       placeholder="Enter name (max 10 chars)" 
                       maxlength="10"
                       style="
                           width: 200px;
                           padding: 8px;
                           margin-bottom: 15px;
                           border: 2px solid #00ff00;
                           border-radius: 4px;
                           background: white;
                           color: black;
                           font-family: 'Courier New', monospace;
                           font-size: 14px;
                       ">
                <br>
                <button id="name-ready-button" style="
                           background: #4CAF50;
                           color: white;
                           border: 2px solid #66BB6A;
                           border-radius: 4px;
                           padding: 8px 16px;
                           font-family: 'Courier New', monospace;
                           font-size: 12px;
                           cursor: pointer;
                       ">Continue to Base Selection</button>
            `;
        } else if (currentPlayerState === 'base') {
            panel.innerHTML = `
                <h2 style="color: #00ff00; margin-bottom: 15px;">BASE SELECTION</h2>
                <p style="color: #ffffff; margin-bottom: 10px;">
                    ${player.name}: Click a highlighted base to place your turret
                </p>
                <p style="color: #cccccc; margin-bottom: 10px;">
                    Player ${playerIndex + 1} of ${playerData.length}
                </p>
                <p style="color: #99ccff; font-size: 12px; margin-bottom: 15px; font-style: italic;">
                    Use mouse/WASD to scroll and find a good position
                </p>
                <button id="back-button" style="
                           background: #666;
                           color: white;
                           border: 2px solid #888;
                           border-radius: 4px;
                           padding: 6px 12px;
                           font-family: 'Courier New', monospace;
                           font-size: 11px;
                           cursor: pointer;
                           margin-right: 10px;
                       ">Back to Name</button>
                <span style="color: #99ccff; font-size: 11px;">or click a green highlighted base</span>
            `;
        }
    }
    
    function setupEventHandlers(player, playerIndex) {
        if (currentPlayerState === 'name') {
            const nameInput = /** @type {HTMLInputElement} */ (panel.querySelector('#player-name-input'));
            const nameReadyButton = panel.querySelector('#name-ready-button');
            
            // Focus management for name input
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
            
            // Input event handlers
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
            
            nameReadyButton.addEventListener('click', handleNameComplete);
            
            function handleNameComplete() {
                const enteredName = nameInput.value.trim();
                if (enteredName.length === 0) {
                    player.name = `Player ${playerIndex + 1}`;
                } else {
                    player.name = enteredName;
                }
                
                console.log(`✅ Player ${playerIndex + 1} name set to: "${player.name}"`);
                
                // Move to base selection phase
                currentPlayerState = 'base';
                updatePanelContent(player, playerIndex);
                setupEventHandlers(player, playerIndex);
                
                // Show base highlights and enable base selection
                showBaseHighlights();
                setupBaseSelection(player, playerIndex);
            }
            
        } else if (currentPlayerState === 'base') {
            const backButton = panel.querySelector('#back-button');
            
            backButton.addEventListener('click', () => {
                // Go back to name input
                currentPlayerState = 'name';
                updatePanelContent(player, playerIndex);
                setupEventHandlers(player, playerIndex);
                
                // Hide base highlights
                hideBaseHighlights();
            });
        }
    }
    
    // Store base highlights for cleanup
    let baseHighlights = [];
    let baseClickHandlers = [];
    
    function showBaseHighlights() {
        console.log('🎯 Showing base highlights for available bases:', availableBases);
        
        // Clear any existing highlights
        hideBaseHighlights();
        
        // Create highlights for each available base
        availableBases.forEach(baseIndex => {
            const base = flatBases[baseIndex];
            if (!base) return;
            
            // Calculate base center position from landscape points
            const baseCenter = calculateBaseCenter(base);
            
            // Create a highlight circle
            const highlight = scene.add.graphics();
            highlight.lineStyle(4, 0x00ff00, 0.8);
            highlight.fillStyle(0x00ff00, 0.2);
            highlight.fillCircle(baseCenter.x, baseCenter.y - 25, 30);
            highlight.strokeCircle(baseCenter.x, baseCenter.y - 25, 30);
            
            // Make it interactive
            const hitArea = new Phaser.Geom.Circle(baseCenter.x, baseCenter.y - 25, 30);
            highlight.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
            
            // Store reference to the highlight
            baseHighlights.push(highlight);
            
            console.log(`✨ Created highlight for base ${baseIndex} at (${baseCenter.x}, ${baseCenter.y})`);
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
                
                // Remove this base from available list
                availableBases = availableBases.filter(index => index !== baseIndex);
                
                // Hide all highlights
                hideBaseHighlights();
                
                // Move to next player or complete setup
                currentPlayerIndex++;
                if (currentPlayerIndex < playerData.length) {
                    // Setup next player
                    showPlayerSetup(currentPlayerIndex);
                } else {
                    // All players done
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
        
        // Cleanup any remaining highlights
        hideBaseHighlights();
        
        // Restore canvas focusability
        const canvasElements = document.querySelectorAll('canvas');
        canvasElements.forEach(canvas => {
            canvas.tabIndex = 0; // Make canvas focusable again
        });
        console.log('✅ Canvas elements restored to focusable');
        
        // Remove overlay
        document.body.removeChild(overlay);
        
        // Call completion callback
        onComplete(playerData);
    }
    
    // Add panel to overlay and overlay to document
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    
    // Start with first player
    showPlayerSetup(0);
}

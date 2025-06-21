// playerSetupDOM.js
// DOM-based player setup UI to avoid Phaser input conflicts

/**
 * Create a DOM-based player setup overlay
 * @param {Array} playerData - Array of player data objects
 * @param {Function} onComplete - Callback when setup is complete
 */
export function createDOMPlayerSetupOverlay(playerData, onComplete) {
    console.log('🖼️ Creating DOM-based player setup overlay...');
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'player-setup-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Courier New', monospace;
        color: white;
    `;
    
    // Create setup panel
    const panel = document.createElement('div');
    panel.style.cssText = `
        background: rgba(0, 0, 0, 0.9);
        border: 3px solid #00ff00;
        border-radius: 12px;
        padding: 30px;
        width: 400px;
        text-align: center;
    `;
    
    let currentPlayerIndex = 0;
    
    function showPlayerSetup(playerIndex) {
        const player = playerData[playerIndex];
        
        panel.innerHTML = `
            <h2 style="color: #00ff00; margin-bottom: 20px;">PLAYER SETUP</h2>
            <p style="color: #ffffff; margin-bottom: 20px;">
                ${player.team.toUpperCase()}: Enter your name
            </p>
            <p style="color: #cccccc; margin-bottom: 20px;">
                Player ${playerIndex + 1} of ${playerData.length}
            </p>
            <input type="text" id="player-name-input" 
                   placeholder="Enter name (max 10 chars)" 
                   maxlength="10"
                   style="
                       width: 200px;
                       padding: 8px;
                       margin-bottom: 20px;
                       border: 2px solid #00ff00;
                       border-radius: 4px;
                       background: white;
                       color: black;
                       font-family: 'Courier New', monospace;
                       font-size: 14px;
                   ">
            <br>
            <button id="ready-button" style="
                       background: #4CAF50;
                       color: white;
                       border: 2px solid #66BB6A;
                       border-radius: 4px;
                       padding: 10px 20px;
                       font-family: 'Courier New', monospace;
                       font-size: 14px;
                       cursor: pointer;
                   ">Ready</button>
            <p style="color: #99ccff; font-size: 12px; margin-top: 15px; font-style: italic;">
                For now, turrets will be placed randomly. Base selection coming soon!
            </p>
        `;
        
        // Set up event handlers
        const nameInput = panel.querySelector('#player-name-input');
        const readyButton = panel.querySelector('#ready-button');
        
        // Ensure the input field receives focus and keyboard events properly
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
            console.log('🎯 Canvas elements made non-focusable temporarily');
        }, 200); // Increased delay to ensure DOM is ready
        
        // Ensure the input field receives all keyboard events
        nameInput.addEventListener('input', (e) => {
            console.log('📝 Input event - current value:', e.target.value);
        });
        
        // Handle key events with proper event handling
        nameInput.addEventListener('keydown', (e) => {
            console.log('🔤 Key pressed in name input:', e.key);
            
            // Prevent Phaser from interfering with input
            e.stopPropagation();
            
            if (e.key === 'Enter') {
                e.preventDefault();
                handleReady();
            }
        });
        
        // Also handle keyup to prevent Phaser interference
        nameInput.addEventListener('keyup', (e) => {
            e.stopPropagation();
        });
        
        // Handle Ready button
        readyButton.addEventListener('click', handleReady);
        
        function handleReady() {
            const enteredName = nameInput.value.trim();
            if (enteredName.length === 0) {
                player.name = `Player ${playerIndex + 1}`;
            } else {
                player.name = enteredName;
            }
            
            // For now, assign sequential base indices (will be replaced with actual selection later)
            // Ensure we don't exceed the number of available bases
            const maxBaseIndex = Math.min(playerIndex, 10); // Assume max 10 bases for safety
            player.baseIndex = maxBaseIndex;
            
            console.log(`✅ Player ${playerIndex + 1} setup complete: name="${player.name}", baseIndex=${player.baseIndex}`);
            
            currentPlayerIndex++;
            if (currentPlayerIndex >= playerData.length) {
                // All players done
                completeSetup();
            } else {
                // Next player
                showPlayerSetup(currentPlayerIndex);
            }
        }
    }
    
    function completeSetup() {
        console.log('🎯 DOM-based player setup complete!', playerData);
        
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

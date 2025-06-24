// gameSetup.js
// Game startup and configuration form handling for Rocket Wars

import { loadGameConfig, saveGameConfig } from './storage.js';
import { GAME_VERSION } from './constants.js';

/**
 * Initialize the game setup form and return a promise that resolves with game config
 * @returns {Promise<Object>} Promise that resolves with the game configuration when form is submitted
 */
export function initializeGameSetup() {
    return new Promise((resolve) => {
        // Initialize form handlers when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => initializeFormHandlers(resolve));
        } else {
            initializeFormHandlers(resolve);
        }
    });
}

/**
 * Initialize form event handlers and slider updates
 * @param {Function} onGameStart - Callback function called with game config when form is submitted
 */
function initializeFormHandlers(onGameStart) {
    const form = document.getElementById('game-config-form');
    const windVariationSlider = /** @type {HTMLInputElement} */ (document.getElementById('wind-variation'));
    const windVariationValue = document.getElementById('wind-variation-value');
    const gravitySlider = /** @type {HTMLInputElement} */ (document.getElementById('gravity'));
    const gravityValue = document.getElementById('gravity-value');
    const numPlayersSelect = /** @type {HTMLSelectElement} */ (document.getElementById('num-players'));
    const gameVersionInfo = document.getElementById('game-version-info');
    
    if (!form || !windVariationSlider || !windVariationValue || !gravitySlider || !gravityValue || !numPlayersSelect) {
        console.error('Could not find required form elements');
        return;
    }
    
    // Display game version
    if (gameVersionInfo) {
        gameVersionInfo.textContent = `v${GAME_VERSION}`;
    }
    
    // Load saved configuration and set form values
    const savedConfig = loadGameConfig();
    numPlayersSelect.value = savedConfig.numPlayers.toString();
    windVariationSlider.value = savedConfig.windVariation.toString();
    gravitySlider.value = savedConfig.gravity.toString();
    
    // Update display values
    windVariationValue.textContent = `${savedConfig.windVariation}%`;
    gravityValue.textContent = savedConfig.gravity.toString();
    
    // Update slider value displays
    windVariationSlider.addEventListener('input', (e) => {
        const target = /** @type {HTMLInputElement} */ (e.target);
        windVariationValue.textContent = `${target.value}%`;
    });
    
    gravitySlider.addEventListener('input', (e) => {
        const target = /** @type {HTMLInputElement} */ (e.target);
        gravityValue.textContent = target.value;
    });
    
    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get current config to preserve player names
        const currentConfig = loadGameConfig();
        
        // Update only the form values, preserving player names
        const gameConfig = {
            ...currentConfig,
            numPlayers: parseInt(numPlayersSelect.value),
            windVariation: parseInt(windVariationSlider.value),
            gravity: parseInt(gravitySlider.value)
        };
        
        console.log('Starting player name entry with config:', gameConfig);
        
        // Save updated configuration to localStorage (preserves player names)
        saveGameConfig(gameConfig);
        
        // Hide initial form and show player names form
        showPlayerNamesForm(gameConfig, onGameStart);
    });
}

/**
 * Hide the configuration form and show the game container
 * @returns {void}
 */
export function hideFormShowGame() {
    const formContainer = document.getElementById('config-form-container');
    const playerNamesFormContainer = document.getElementById('player-names-form-container');
    const gameContainer = document.getElementById('game-container');
    
    if (formContainer) {
        formContainer.style.display = 'none';
    }
    
    if (playerNamesFormContainer) {
        playerNamesFormContainer.style.display = 'none';
    }
    
    if (gameContainer) {
        gameContainer.style.display = 'flex';
    }
}

/**
 * Show the configuration form and hide the game container (for returning to menu)
 * @returns {void}
 */
export function showFormHideGame() {
    const formContainer = document.getElementById('config-form-container');
    const playerNamesFormContainer = document.getElementById('player-names-form-container');
    const gameContainer = document.getElementById('game-container');
    
    if (formContainer) {
        formContainer.style.display = 'flex';
    }
    
    if (playerNamesFormContainer) {
        playerNamesFormContainer.style.display = 'none';
    }
    
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
}

/**
 * Show the player names form and handle player name entry
 * @param {Object} gameConfig - Game configuration from the initial form
 * @param {Function} onGameStart - Callback function called when player names are set
 */
function showPlayerNamesForm(gameConfig, onGameStart) {
    const configFormContainer = document.getElementById('config-form-container');
    const playerNamesFormContainer = document.getElementById('player-names-form-container');
    const playerNamesForm = document.getElementById('player-names-form');
    const playerNameInputsContainer = document.getElementById('player-name-inputs');
    
    if (!configFormContainer || !playerNamesFormContainer || !playerNamesForm || !playerNameInputsContainer) {
        console.error('Could not find required player names form elements');
        return;
    }
    
    // Hide config form and show player names form
    configFormContainer.style.display = 'none';
    playerNamesFormContainer.style.display = 'block';
    
    // Load saved player names
    const savedConfig = loadGameConfig();
    const savedPlayerNames = savedConfig.playerNames || {};
    
    // Clear existing inputs and create new ones based on number of players
    playerNameInputsContainer.innerHTML = '';
    
    for (let i = 1; i <= gameConfig.numPlayers; i++) {
        const playerKey = `player${i}`;
        const defaultName = `Player ${i}`;
        const savedName = savedPlayerNames[playerKey] || '';
        
        const inputGroup = document.createElement('div');
        inputGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = `${defaultName} Name:`;
        label.setAttribute('for', `player-${i}-name`);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `player-${i}-name`;
        input.name = playerKey;
        input.placeholder = `Enter name (max 10 chars) or leave blank for "${defaultName}"`;
        input.maxLength = 10;
        input.value = savedName;
        
        // Add Enter key handler for better usability
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Focus next input or submit if this is the last one
                const nextInput = document.getElementById(`player-${i + 1}-name`);
                if (nextInput) {
                    nextInput.focus();
                } else {
                    // This is the last input, submit the form
                    playerNamesForm.dispatchEvent(new Event('submit'));
                }
            }
        });
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        playerNameInputsContainer.appendChild(inputGroup);
    }
    
    // Handle player names form submission
    playerNamesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Collect player names from form
        const playerNames = {};
        for (let i = 1; i <= gameConfig.numPlayers; i++) {
            const playerKey = `player${i}`;
            const input = /** @type {HTMLInputElement} */ (document.getElementById(`player-${i}-name`));
            const enteredName = input.value.trim();
            
            // Use entered name or fall back to default
            playerNames[playerKey] = enteredName || `Player ${i}`;
        }
        
        // Update game config with player names
        const finalGameConfig = {
            ...gameConfig,
            playerNames: {
                ...savedConfig.playerNames,
                ...playerNames
            }
        };
        
        console.log('Final game config with player names:', finalGameConfig);
        
        // Save the complete configuration
        saveGameConfig(finalGameConfig);
        
        // Hide player names form and show game container
        hideFormShowGame();
        
        // Call the game start callback with the final configuration
        onGameStart(finalGameConfig);
    });
}

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
        
        console.log('Starting game with config:', gameConfig);
        
        // Save updated configuration to localStorage (preserves player names)
        saveGameConfig(gameConfig);
        
        // Hide form and show game container
        hideFormShowGame();
        
        // Call the game start callback with the configuration
        onGameStart(gameConfig);
    });
}

/**
 * Hide the configuration form and show the game container
 * @returns {void}
 */
export function hideFormShowGame() {
    const formContainer = document.getElementById('config-form-container');
    const gameContainer = document.getElementById('game-container');
    
    if (formContainer) {
        formContainer.style.display = 'none';
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
    const gameContainer = document.getElementById('game-container');
    
    if (formContainer) {
        formContainer.style.display = 'flex';
    }
    
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
}

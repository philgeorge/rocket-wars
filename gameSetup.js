// gameSetup.js
// Game startup and configuration form handling for Rocket Wars

/**
 * Default game configuration
 */
export const defaultGameConfig = {
    numPlayers: 2,
    windVariation: 50,
    gravity: 30
};

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
    
    if (!form || !windVariationSlider || !windVariationValue || !gravitySlider || !gravityValue) {
        console.error('Could not find required form elements');
        return;
    }
    
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
        
        // Get form values
        const numPlayersSelect = /** @type {HTMLSelectElement} */ (document.getElementById('num-players'));
        const gameConfig = {
            numPlayers: parseInt(numPlayersSelect.value),
            windVariation: parseInt(windVariationSlider.value),
            gravity: parseInt(gravitySlider.value)
        };
        
        console.log('Starting game with config:', gameConfig);
        
        // Hide form and show game container
        hideFormShowGame();
        
        // Call the game start callback with the configuration
        onGameStart(gameConfig);
    });
}

/**
 * Hide the configuration form and show the game container
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

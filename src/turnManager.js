// turnManager.js
// Turn and round management system for Rocket Wars

/**
 * Initialize game state with rounds and turns tracking
 * @param {Object} [config] - Game configuration from form
 * @returns {Object} Game state with turn/round management properties
 */
function createTurnBasedGameState(config = {}) {
    const turnTime = config.turnTime ?? 30; // Turn time limit from form or default
    const rounds = config.rounds ?? 10; // Max rounds from form or default
    const numPlayers = config.numPlayers ?? 2; // Number of players from form or default
    
    // Create array of alive player numbers (1, 2, 3, 4...)
    const playersAlive = [];
    for (let i = 1; i <= numPlayers; i++) {
        playersAlive.push(i);
    }
    
    return {
        // Rounds and turns tracking
        currentRound: 1,
        maxRounds: rounds,
        currentPlayerIndex: 0, // 0-based index into playersAlive array
        playersAlive: playersAlive, // Array of player numbers still in the game
        turnTimeLimit: turnTime, // Turn time limit in seconds
        turnStartTime: null, // Timestamp when current turn began (null = no active turn)
        hasPlayerFiredThisTurn: false, // Prevent multiple shots per turn
        turnTimer: null // Timer ID for countdown
    };
}

/**
 * Initialize complete game state object
 * @param {Object} [config] - Optional game configuration from form
 * @returns {Object} Complete game state with all game data
 */
export function createGameState(config = {}) {
    const windVariation = config.windVariation ?? 50; // Wind variation from form or default
    const gravity = config.gravity ?? 60; // Gravity from form or default (updated default)
    const numPlayers = config.numPlayers ?? 2; // Number of players from form or default
    const maxWind = (windVariation / 100) * 100; // Calculate max wind for initial value
    const initialWind = Math.floor(Math.random() * (2 * maxWind + 1)) - maxWind; // Random initial wind
    
    // Create the base game state with turn management
    const gameState = {
        wind: {
            current: initialWind, // Current wind (-100 to +100, negative = left, positive = right)
            variation: windVariation // Wind variation percentage (0-100%), controls how much wind can change
        },
        gravity: gravity, // Gravity setting from form
        numPlayers: numPlayers,
        
        // Merge in turn-based game state
        ...createTurnBasedGameState(config)
    };
    
    // Add player objects dynamically
    for (let i = 1; i <= numPlayers; i++) {
        gameState[`player${i}`] = {
            health: 100,
            kills: 0,
            deaths: 0
        };
    }
    
    return gameState;
}

/**
 * Update wind value for new turn (changes by at most +/-10 units)
 * @param {Object} gameState - Game state object
 */
export function updateWindForNewTurn(gameState) {
    // Wind can only change by up to +/-10 units per turn
    const maxDelta = 10;
    const maxWind = (gameState.wind.variation / 100) * 100; // Still use variation for clamping
    // Generate random delta from -10 to +10
    const delta = Math.floor(Math.random() * (2 * maxDelta + 1)) - maxDelta;
    let newWind = gameState.wind.current + delta;
    // Clamp to allowed wind range
    newWind = Math.max(-maxWind, Math.min(maxWind, newWind));
    gameState.wind.current = newWind;
}

/**
 * Apply damage to a player's health
 * @param {Object} gameState - Game state object
 * @param {string} playerKey - 'player1' or 'player2'
 * @param {number} damage - Damage amount (0-100)
 */
export function applyDamage(gameState, playerKey, damage) {
    gameState[playerKey].health = Math.max(0, gameState[playerKey].health - damage);
    
    // Check if player died
    if (gameState[playerKey].health <= 0) {
        gameState[playerKey].deaths++;
        
        // Award kill to other player
        const otherPlayer = playerKey === 'player1' ? 'player2' : 'player1';
        gameState[otherPlayer].kills++;
    }
}

/**
 * Get the current active player number
 * @param {Object} gameState - Game state object
 * @returns {number} Current player number (1, 2, 3, or 4)
 */
export function getCurrentPlayer(gameState) {
    if (gameState.playersAlive.length === 0) {
        return 1; // Fallback
    }
    return gameState.playersAlive[gameState.currentPlayerIndex];
}

/**
 * Get the current active player key (for accessing player data)
 * @param {Object} gameState - Game state object
 * @returns {string} Current player key ('player1', 'player2', etc.)
 */
export function getCurrentPlayerKey(gameState) {
    const playerNum = getCurrentPlayer(gameState);
    return `player${playerNum}`;
}

/**
 * Check if a specific player number is the current active player
 * @param {Object} gameState - Game state object
 * @param {number} playerNum - Player number to check (1, 2, 3, or 4)
 * @returns {boolean} True if this player is currently active
 */
export function isPlayerActive(gameState, playerNum) {
    return getCurrentPlayer(gameState) === playerNum;
}

/**
 * Remove a player from the game (when they die)
 * @param {Object} gameState - Game state object
 * @param {number} playerNum - Player number to remove (1, 2, 3, or 4)
 */
export function removePlayer(gameState, playerNum) {
    const playerIndex = gameState.playersAlive.indexOf(playerNum);
    if (playerIndex !== -1) {
        gameState.playersAlive.splice(playerIndex, 1);
        
        // Adjust current player index if needed
        if (gameState.currentPlayerIndex >= gameState.playersAlive.length) {
            gameState.currentPlayerIndex = 0; // Wrap to start of round
        }
        
        console.log(`Player ${playerNum} eliminated. Remaining players:`, gameState.playersAlive);
    }
}

/**
 * Advance to the next player's turn
 * @param {Object} gameState - Game state object
 * @returns {boolean} True if advanced to next player, false if round completed
 */
export function advanceToNextPlayer(gameState) {
    // Reset turn state
    gameState.hasPlayerFiredThisTurn = false;
    gameState.turnStartTime = null;
    
    // Clear any existing turn timer
    if (gameState.turnTimer) {
        clearInterval(gameState.turnTimer);
        gameState.turnTimer = null;
    }
    
    // Move to next player
    gameState.currentPlayerIndex++;
    
    // Check if we've gone through all players (round complete)
    if (gameState.currentPlayerIndex >= gameState.playersAlive.length) {
        gameState.currentPlayerIndex = 0;
        return false; // Round completed
    }
    
    console.log(`Turn advanced to Player ${getCurrentPlayer(gameState)}`);
    return true; // Still in same round
}

/**
 * Advance to the next round
 * @param {Object} gameState - Game state object
 * @returns {boolean} True if advanced to next round, false if game should end
 */
export function advanceToNextRound(gameState) {
    gameState.currentRound++;
    gameState.currentPlayerIndex = 0; // Start with first alive player
    
    // Reset turn state
    gameState.hasPlayerFiredThisTurn = false;
    gameState.turnStartTime = null;
    
    // Clear any existing turn timer
    if (gameState.turnTimer) {
        clearInterval(gameState.turnTimer);
        gameState.turnTimer = null;
    }
    
    console.log(`Advanced to Round ${gameState.currentRound}`);
    
    // Check if we've reached max rounds
    if (gameState.currentRound > gameState.maxRounds) {
        console.log('Game ended: Maximum rounds reached');
        return false; // Game should end
    }
    
    return true; // Continue playing
}

/**
 * Check if the game should end
 * @param {Object} gameState - Game state object
 * @returns {boolean} True if game should end
 */
export function shouldGameEnd(gameState) {
    // Game ends if only one player remains
    if (gameState.playersAlive.length <= 1) {
        return true;
    }
    
    // Game ends if max rounds completed
    if (gameState.currentRound > gameState.maxRounds) {
        return true;
    }
    
    return false;
}

/**
 * Start a new turn for the current player
 * @param {Object} gameState - Game state object
 */
export function startPlayerTurn(gameState) {
    gameState.turnStartTime = Date.now();
    gameState.hasPlayerFiredThisTurn = false;
    
    console.log(`Started turn for Player ${getCurrentPlayer(gameState)} in Round ${gameState.currentRound}`);
}

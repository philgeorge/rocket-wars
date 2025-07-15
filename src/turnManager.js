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
        turnTimer: null, // Timer ID for countdown
        lastRemainingTime: null // Last remaining time when timer was stopped
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
        if (playerIndex < gameState.currentPlayerIndex) {
            // If we removed a player before the current player, shift the index down by 1
            gameState.currentPlayerIndex--;
        } else if (gameState.currentPlayerIndex >= gameState.playersAlive.length) {
            // If current player index is now beyond the end, wrap to start of round
            gameState.currentPlayerIndex = 0;
        }
        
        console.log(`Player ${playerNum} eliminated. Remaining players:`, gameState.playersAlive);
        console.log(`Current player index adjusted to: ${gameState.currentPlayerIndex} (Player ${getCurrentPlayer(gameState)})`);
    }
}

/**
 * Advance to the next player's turn
 * @param {Object} gameState - Game state object
 * @returns {boolean} True if advanced to next player, false if round completed
 */
export function advanceToNextPlayer(gameState) {
    console.log(`🔄 Advancing from player index ${gameState.currentPlayerIndex} (Player ${getCurrentPlayer(gameState)})`);
    
    // Stop current turn timer and reset turn state
    stopTurnTimer(gameState);
    gameState.hasPlayerFiredThisTurn = false;
    gameState.lastRemainingTime = null; // Reset for next turn
    
    // Move to next player
    gameState.currentPlayerIndex++;
    
    // Check if we've gone through all players (round complete)
    if (gameState.currentPlayerIndex >= gameState.playersAlive.length) {
        gameState.currentPlayerIndex = 0;
        console.log(`Round ${gameState.currentRound} completed, wrapping to start of next round`);
        return false; // Round completed
    }
    
    console.log(`🎯 Turn advanced to Player ${getCurrentPlayer(gameState)} (index ${gameState.currentPlayerIndex})`);
    return true; // Still in same round
}

/**
 * Advance to the next round
 * @param {Object} gameState - Game state object
 * @returns {boolean} True if advanced to next round, false if game should end
 */
export function advanceToNextRound(gameState) {
    // Check if we would exceed max rounds AFTER incrementing
    if (gameState.currentRound + 1 > gameState.maxRounds) {
        console.log('Game ended: Maximum rounds reached');
        return false; // Game should end
    }
    
    gameState.currentRound++;
    gameState.currentPlayerIndex = 0; // Start with first alive player
    
    // Stop current turn timer and reset turn state
    stopTurnTimer(gameState);
    gameState.hasPlayerFiredThisTurn = false;
    gameState.lastRemainingTime = null; // Reset for next round
    
    console.log(`Advanced to Round ${gameState.currentRound}`);
    
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
    
    // Game ends if max rounds completed (we've finished the final round)
    if (gameState.currentRound > gameState.maxRounds) {
        return true;
    }
    
    return false;
}

/**
 * Start a new turn for the current player
 * @param {Object} gameState - Game state object
 * @param {Function} [onTimeUp] - Optional callback when turn time expires
 */
export function startPlayerTurn(gameState, onTimeUp = null) {
    gameState.turnStartTime = Date.now();
    gameState.hasPlayerFiredThisTurn = false;
    gameState.lastRemainingTime = null; // Reset last remaining time for new turn
    
    // Clear any existing timer
    if (gameState.turnTimer) {
        clearInterval(gameState.turnTimer);
        gameState.turnTimer = null;
    }
    
    // Start countdown timer if there's a time limit
    if (gameState.turnTimeLimit > 0 && onTimeUp) {
        gameState.turnTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
            const remaining = gameState.turnTimeLimit - elapsed;
            
            if (remaining <= 0) {
                // Time's up - clear timer and call callback
                clearInterval(gameState.turnTimer);
                gameState.turnTimer = null;
                gameState.turnStartTime = null;
                console.log(`⏰ Time's up for Player ${getCurrentPlayer(gameState)}`);
                onTimeUp();
            }
        }, 100); // Check every 100ms for smooth countdown
    }
    
    const currentPlayer = getCurrentPlayer(gameState);
    console.log(`🎯 Started turn for Player ${currentPlayer} in Round ${gameState.currentRound} (${gameState.turnTimeLimit}s limit)`);
    console.log(`Players alive: [${gameState.playersAlive.join(', ')}], current index: ${gameState.currentPlayerIndex}`);
}

/**
 * Get remaining time for current turn in seconds
 * @param {Object} gameState - Game state object
 * @returns {number} Remaining time in seconds (0 if no active turn)
 */
export function getRemainingTurnTime(gameState) {
    if (!gameState.turnStartTime || gameState.turnTimeLimit <= 0) {
        return 0;
    }
    const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
    const remaining = gameState.turnTimeLimit - elapsed;
    return Math.max(0, remaining);
}

/**
 * Stop the current turn timer (used when player fires or turn ends early)
 * @param {Object} gameState - Game state object
 */
export function stopTurnTimer(gameState) {
    // Capture remaining time before stopping timer
    if (gameState.turnStartTime && gameState.turnTimeLimit > 0) {
        const elapsed = Math.floor((Date.now() - gameState.turnStartTime) / 1000);
        gameState.lastRemainingTime = Math.max(0, gameState.turnTimeLimit - elapsed);
    }
    
    if (gameState.turnTimer) {
        clearInterval(gameState.turnTimer);
        gameState.turnTimer = null;
    }
    gameState.turnStartTime = null;
}

/**
 * Get players ranked by game results
 * @param {Object} gameState - Game state object
 * @param {Array} playerData - Player data with names
 * @returns {Array} Ranked player list
 */
export function getRankedPlayers(gameState, playerData = null) {
    const players = [];
    
    // Collect all player data
    for (let i = 1; i <= gameState.numPlayers; i++) {
        const playerKey = `player${i}`;
        const player = gameState[playerKey];
        const isAlive = gameState.playersAlive.includes(i);
        
        let playerName = `PLAYER ${i}`;
        if (playerData && playerData[i - 1] && playerData[i - 1].name) {
            playerName = playerData[i - 1].name.toUpperCase();
        }
        
        players.push({
            number: i,
            name: playerName,
            health: player.health,
            isAlive: isAlive,
            kills: player.kills || 0,
            deaths: player.deaths || 0
        });
    }
    
    // Sort players: alive first, then by health descending
    players.sort((a, b) => {
        // Alive players come first
        if (a.isAlive !== b.isAlive) {
            return b.isAlive ? 1 : -1;
        }
        // Then sort by health (highest first)
        return b.health - a.health;
    });
    
    return players;
}

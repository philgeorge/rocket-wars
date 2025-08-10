// constants.js
// Shared game constants for Rocket Wars

/**
 * Game version - updated automatically by update-version.js
 */
export const GAME_VERSION = '20250810-2228';

/**
 * Team/Player color definitions (2-4 players max)
 * Provides both hex format (for Phaser graphics) and CSS format (for text styling)
 */
export const TEAM_COLORS = {
    player1: {
        hex: 0x4a90e2,     // Blue - Phaser format
        css: '#4a90e2',    // Blue - CSS format
        name: 'Blue'
    },
    player2: {
        hex: 0xf1c40f,     // Yellow - Phaser format  
        css: '#f1c40f',    // Yellow - CSS format
        name: 'Yellow'
    },
    player3: {
        hex: 0xff8c00,     // Orange - Phaser format
        css: '#ff8c00',    // Orange - CSS format
        name: 'Orange'
    },
    player4: {
        hex: 0x2ecc71,     // Green - Phaser format
        css: '#2ecc71',    // Green - CSS format
        name: 'Green'
    }
};

/**
 * Player team names array for easy iteration
 */
export const PLAYER_TEAMS = ['player1', 'player2', 'player3', 'player4'];

/**
 * Get team color in hex format (for Phaser graphics)
 * @param {string} team - Team key ('player1', 'player2', etc.)
 * @returns {number} Hex color value
 */
export function getTeamColorHex(team) {
    return TEAM_COLORS[team]?.hex || TEAM_COLORS.player1.hex;
}

/**
 * Get team color in CSS format (for text styling)
 * @param {string} team - Team key ('player1', 'player2', etc.)
 * @returns {string} CSS color string
 */
export function getTeamColorCSS(team) {
    return TEAM_COLORS[team]?.css || TEAM_COLORS.player1.css;
}

/**
 * Get team color name for display
 * @param {string} team - Team key ('player1', 'player2', etc.)
 * @returns {string} Human-readable color name
 */
export function getTeamColorName(team) {
    return TEAM_COLORS[team]?.name || TEAM_COLORS.player1.name;
}

/**
 * World dimension constants
 */
export const WORLD_HEIGHT = 800;

/**
 * Calculate world width based on number of players
 * @param {number} numPlayers - Number of players in the game
 * @returns {number} World width in pixels
 */
export function calculateWorldWidth(numPlayers) {
    return 2000 + (numPlayers * 500);
}

// updateUI.js
// Centralized helpers for updating game UI panels & teleport button state.

/**
 * Update environment panel (display + teleport button) and player stats panel.
 * Uses defensive optional chaining to avoid errors if panels not yet created.
 * @param {any} scene
 * @param {any} gameState
 * @param {{updateEnvironment?: boolean, updatePlayers?: boolean, updateTeleport?: boolean, focusCamera?: boolean}} [opts]
 */
export function updateGameUI(scene, gameState, opts = {}) {
  if (!gameState || !scene) return;
  const { updateEnvironment = true, updatePlayers = true, updateTeleport = true } = opts;
  if (updateEnvironment) {
    scene.environmentPanel?.updateDisplay?.(gameState);
  }
  if (updatePlayers) {
    scene.playerStatsPanel?.updateDisplay?.(gameState);
  }
  if (updateTeleport) {
    scene.environmentPanel?.updateTeleportButton?.(gameState, scene);
  }
}

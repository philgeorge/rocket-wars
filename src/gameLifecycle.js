// gameLifecycle.js
// Game lifecycle management functions

import { stopTurnTimer, getRankedPlayers } from './turnManager.js';
import { info } from './logger.js';
import { updateGameUI } from './ui/updateUI.js';
import { createResultsPanel, positionResultsPanel, setupResultsPanelRestart, hideAimingInstructionsPanel } from './ui/index.js';

/**
 * Handle end of game - show results panel and focus on winner
 * @param {any} scene - The Phaser scene
 * @param {string} reason - Reason for game end ('max_rounds' or 'last_player')
 */
export function handleGameEnd(scene, reason) {
    info(`🏁 Game ended: ${reason}`);
    
    // Set game ended flag for keyboard input handling
    scene.gameEnded = true;
    
    // Update UI (teleport button included) to reflect game end state
    updateGameUI(scene, scene.gameState, { updateEnvironment: false, updatePlayers: false, updateTeleport: true });
    
    // Stop any active turn timer
    stopTurnTimer(scene.gameState);
    
    // Hide aiming instructions panel if it's still visible
    if (scene.aimingInstructionsPanel) {
        hideAimingInstructionsPanel(scene.aimingInstructionsPanel);
    }
    
    // Create and show results panel
    scene.resultsPanel = createResultsPanel(scene, scene.gameState, scene.playerData);
    positionResultsPanel(scene.resultsPanel, scene.cameras.main.width, scene.cameras.main.height);
    
    // Set up restart functionality
    setupResultsPanelRestart(scene);
    
    // Focus camera on the winner (first player in results)
    const winner = getRankedPlayers(scene.gameState, scene.playerData)[0];
    if (winner && scene.turrets) {
        const winnerTurret = scene.turrets.find(turret => turret.team === `player${winner.number}`);
        if (winnerTurret) {
            // Smooth pan to winner's turret
            scene.cameras.main.pan(winnerTurret.x, winnerTurret.y - 100, 2000, 'Power2');
        }
    }
    
    info(`🎊 Game complete! Winner: Player ${winner ? winner.number : 'Unknown'}`);
}

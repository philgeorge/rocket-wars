// gameLifecycle.js
// Game lifecycle management functions

import { stopTurnTimer, getRankedPlayers } from './turnManager.js';
import { createResultsPanel, positionResultsPanel, setupResultsPanelRestart, hideAimingInstructionsPanel } from './ui/index.js';

/**
 * Handle end of game - show results panel and focus on winner
 * @param {any} scene - The Phaser scene
 * @param {string} reason - Reason for game end ('max_rounds' or 'last_player')
 */
export function handleGameEnd(scene, reason) {
    console.log(`🏁 Game ended: ${reason}`);
    
    // Set game ended flag for keyboard input handling
    scene.gameEnded = true;
    
    // Update teleport button to disable it since game has ended
    scene.environmentPanel?.updateTeleportButton?.(scene.gameState, scene);
    
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
    setupResultsPanelRestart(scene, scene.resultsPanel);
    
    // Focus camera on the winner (first player in results)
    const winner = getRankedPlayers(scene.gameState, scene.playerData)[0];
    if (winner && scene.turrets) {
        const winnerTurret = scene.turrets.find(turret => turret.team === `player${winner.number}`);
        if (winnerTurret) {
            // Smooth pan to winner's turret
            scene.cameras.main.pan(winnerTurret.x, winnerTurret.y - 100, 2000, 'Power2');
        }
    }
    
    console.log(`🎊 Game complete! Winner: Player ${winner ? winner.number : 'Unknown'}`);
}

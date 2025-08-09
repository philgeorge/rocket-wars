// turnFlow.js
// Unified turn progression and UI update orchestration
// Consolidates duplicated logic previously spread across main.js (handleTurnTimeout),
// projectileManager.js (per-impact progression) and teleport completion.

import { advanceToNextPlayer, advanceToNextRound, shouldGameEnd, updateWindForNewTurn, startPlayerTurn, removePlayer } from './turnManager.js';
import { handleGameEnd } from './gameLifecycle.js';
import { focusCameraOnActivePlayer } from './projectileManager.js';
import { updateGameUI } from './ui/updateUI.js';

/**
 * Eliminate players with health <= 0 and remove their turrets.
 * @param {any} gameState
 * @param {any} scene
 */
function eliminateDeadPlayers(gameState, scene) {
    if (!gameState || !scene || !scene.turrets) return;
    const eliminated = [];
    for (let i = 1; i <= gameState.numPlayers; i++) {
        const key = `player${i}`;
        const player = gameState[key];
        if (player && player.health <= 0 && gameState.playersAlive.includes(i)) {
            eliminated.push(i);
        }
    }
    if (eliminated.length === 0) return;
    console.log(`💀 Eliminating players: [${eliminated.join(', ')}]`);
    eliminated.forEach(num => {
        removePlayer(gameState, num);
        const teamKey = `player${num}`;
        const idx = scene.turrets.findIndex(t => t.team === teamKey);
        if (idx !== -1) {
            const t = scene.turrets[idx];
            console.log(`💀 Destroying turret for ${teamKey}`);
            t.destroy();
            scene.turrets.splice(idx, 1);
        }
    });
}

/**
 * Update panels and focus camera after turn state changes.
 * @param {any} scene
 * @param {any} gameState
 */
function updateUIAndCamera(scene, gameState) {
    // Single centralized UI update prevents duplicate work
    updateGameUI(scene, gameState, { updateEnvironment: true, updatePlayers: true, updateTeleport: true });
    focusCameraOnActivePlayer(gameState, scene);
}

/**
 * Unified turn progression entry point.
 * @param {any} scene - Phaser scene.
 * @param {string} reason - 'timeout' | 'projectile' | 'teleport' | 'manual'.
 * @param {{delayMs?: number}} [opts]
 */
export function progressTurn(scene, reason, opts = {}) {
    const delayMs = opts.delayMs ?? 0;
    const gameState = scene.gameState;
    if (!gameState) {
        console.warn('progressTurn called without gameState');
        return;
    }
    if (scene.gameEnded) return; // Already ended.

    console.log(`\uD83D\uDD04 progressTurn start (reason=${reason}, delayMs=${delayMs})`);

    // 1. Eliminate dead players.
    eliminateDeadPlayers(gameState, scene);

    // 2. Check for immediate game end.
    if (shouldGameEnd(gameState)) {
        handleGameEnd(scene, gameState.playersAlive.length <= 1 ? 'last_player' : 'max_rounds');
        return;
    }

    // 3. Advance to next player / round.
    const sameRound = advanceToNextPlayer(gameState, scene);
    if (!sameRound) {
        const continueGame = advanceToNextRound(gameState);
        if (!continueGame) {
            handleGameEnd(scene, 'max_rounds');
            return;
        }
        updateWindForNewTurn(gameState);
    }

    // 4. Schedule next turn start after visual delay (explosions, etc.).
    scene.time.delayedCall(delayMs, () => {
        if (scene.gameEnded) return; // Re-check.
        startPlayerTurn(gameState, () => scene.progressTurn('timeout'));
        updateUIAndCamera(scene, gameState);
    });
}

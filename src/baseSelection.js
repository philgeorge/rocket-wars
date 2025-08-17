// baseSelection.js
// Base selection stage logic for Rocket Wars

import { createGunTurret } from './turret.js';
import { createBaseSelectionPanel, hideBaseSelectionPanel, positionBaseSelectionPanel } from './ui/index.js';
import { getCurrentPlayer } from './turnManager.js';
import { info, trace, warn, error as logError } from './logger.js';
import { getTurretPositionForChunk, listSelectableChunkIndices } from './chunkBaseHelpers.js';

/**
 * Base selection stage state management
 * @typedef {Object} SetupState
 * @property {number} currentPlayerIndex - Current player being processed (0-based)
 * @property {PlayerData[]} players - Array of player data objects
 * @property {number[]} availableBases - Array of unused flat base indices
 * @property {boolean} isComplete - Whether all players have completed base selection
 */

/**
 * Initialize base selection for multiple players (full game setup)
 * @param {Scene} scene - The Phaser scene instance
 * @param {Object} gameConfig - Game configuration object
 * @returns {Promise<{players: PlayerData[], turrets: any[]}>} Promise that resolves with player selection data and created turrets
 */
export function initializeBaseSelection(scene, gameConfig) {
    info('🎮 Starting Phaser-based base selection stage...');
    
    // Camera controls remain enabled since we're using Phaser panels now
    trace('🎮 Camera controls remain enabled for base selection');
    
    return new Promise((resolve) => {
        // Initialize player data structures
        const players = [];
        for (let i = 1; i <= gameConfig.numPlayers; i++) {
            const playerKey = `player${i}`;
            /** @type {PlayerData} */
            const playerData = {
                id: playerKey,
                name: gameConfig.playerNames?.[playerKey] || `Player ${i}`, // Use name from game config
                team: playerKey,
                chunkIndex: null,
                health: 100,
                turret: null
            };
            players.push(playerData);
        }
        
        trace('🎮 Player data initialized with names from game config:', players.map(p => ({ id: p.id, name: p.name })));
        
        // Initialize base selection logic (no need to create panel upfront)
        startBaseSelection(scene, players, resolve);
    });
}

/**
 * Start the base selection process using Phaser panels
 * @param {Scene} scene - The Phaser scene with custom properties
 * @param {PlayerData[]} players - Array of player data
 * @param {Function} resolve - Promise resolve function
 */
function startBaseSelection(scene, players, resolve) {
    // Chunk-based selection path
    const chunks = scene.landscapeData?.chunks;
    if (!chunks) {
        logError('❌ No chunks available in scene for base selection');
        return;
    }
    let currentPlayerIndex = 0;
    let availableChunkIndices = listSelectableChunkIndices(chunks, []);
    const setupTurrets = [];
    
    function showBaseSelection(playerIndex) {
        const player = players[playerIndex];
        
        info(`🎯 Starting base selection for ${player.name} (${playerIndex + 1}/${players.length})`);
        
        // Use the shared single-player base selection logic
        startSinglePlayerChunkSelection(scene, player, chunks, availableChunkIndices, {
            onBaseSelected: (chunkIndex, position) => {
                info(`🎯 Player ${player.name} selected chunk ${chunkIndex}`);
                player.chunkIndex = chunkIndex;
                player.basePosition = position;
                const turret = createGunTurret(scene, position.x, position.y, player.team);
                player.turret = turret;
                setupTurrets.push(turret);
                trace(`🏭 Placed turret for ${player.name} at chunk ${chunkIndex} (${position.x}, ${position.y})`);
                // Recompute available chunk indices excluding occupied
                const occupied = players.filter(p => p.chunkIndex !== null && p.chunkIndex !== undefined).map(p => p.chunkIndex);
                availableChunkIndices = listSelectableChunkIndices(chunks, occupied);
                
                // Move to next player or complete setup
                currentPlayerIndex++;
                if (currentPlayerIndex < players.length) {
                    showBaseSelection(currentPlayerIndex);
                } else {
                    completeSetup();
                }
            },
            onCancelled: () => {
                warn('🚫 Base selection cancelled - this should not happen in initial setup');
                // In initial setup, cancellation shouldn't happen, but we could handle it
            }
        }, false);
    }
    
    function completeSetup() {
        info('🎯 Phaser-based base selection complete!', players);
        trace('🏭 Turrets created during base selection:', setupTurrets.length);
        
        // Resolve the promise with player data and existing turrets
        resolve({ players: players, turrets: setupTurrets });
    }
    
    // Handle window resize for panel positioning (shared logic will handle this)
    
    // Start with first player
    showBaseSelection(0);
}

/**
 * New chunk-based single-player selection (Phase 1)
 * @param {Scene} scene
 * @param {PlayerData} player
 * @param {any[]} chunks
 * @param {number[]} availableChunkIndices
 * @param {{onBaseSelected:Function,onCancelled:Function}} callbacks
 * @param {boolean} isTeleportMode
 */
function startSinglePlayerChunkSelection(scene, player, chunks, availableChunkIndices, callbacks, isTeleportMode = false) {
    // Track the currently highlighted chunk index (by mouse/keyboard)
    let highlightedChunkIndex = -1;
    let currentPanel = createBaseSelectionPanel(scene, player);
    positionBaseSelectionPanel(currentPanel, scene.cameras.main.width, isTeleportMode);
    let previewTurret = null;
    let isSelectionActive = true;
    const keyboardHandlers = [];
    // Input listeners we must remove on cleanup
    let pointerMoveHandler = null;
    let pointerDownHandler = null;
    // Hold-to-repeat timers for keyboard navigation
    let leftHoldTimer = null;
    let rightHoldTimer = null;
    // Set pointer cursor for selection and remember the previous cursor
    const prevCursor = scene.game?.canvas?.style?.cursor || '';
    if (scene.input?.setDefaultCursor) scene.input.setDefaultCursor('pointer');

    const resizeHandler = () => {
        if (currentPanel && isSelectionActive) {
            positionBaseSelectionPanel(currentPanel, scene.cameras.main.width, isTeleportMode);
        }
    };
    window.addEventListener('resize', resizeHandler);

    scene.activeBaseSelectionCleanup = cleanup;

    const escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
        if (!isSelectionActive) return;
        isSelectionActive = false;
        cleanup();
        callbacks.onCancelled();
    });
    keyboardHandlers.push(escKey);

    setupPointerTracking();
    setupKeyboardHandlers();

    function clearHighlight() {
        highlightedChunkIndex = -1;
        clearPreview();
    }

    function setupPointerTracking() {
        const cam = scene.cameras.main;
        const availableSet = new Set(availableChunkIndices);
        // helper to get chunk index by worldX
        function findChunkIndexAtX(worldX) {
            for (let i = 0; i < chunks.length; i++) {
                const c = chunks[i];
                const left = c.x;
                const right = c.x + c.width;
                const within = (worldX >= left && (worldX < right || (i === chunks.length - 1 && worldX <= right + 0.5)));
                if (within) return i;
            }
            return -1;
        }
        function updateHighlightToIndex(idx) {
            if (!isSelectionActive) return;
            if (idx === -1 || !availableSet.has(idx)) { clearHighlight(); return; }
            highlightedChunkIndex = idx;
            // update preview turret only
            clearPreview();
            createPreview(idx);
        }
        pointerMoveHandler = (pointer) => {
            if (!isSelectionActive) return;
            // Convert to world coords
            const worldX = pointer.worldX ?? (pointer.x + cam.scrollX);
            const idx = findChunkIndexAtX(worldX);
            updateHighlightToIndex(idx);
        };
        scene.input.on('pointermove', pointerMoveHandler);
        pointerDownHandler = (_pointer) => {
            if (!isSelectionActive) return;
            if (highlightedChunkIndex === -1) return;
            // Click/tap confirms the currently highlighted chunk
            finalize(highlightedChunkIndex);
        };
        scene.input.on('pointerdown', pointerDownHandler);
    }

    function setupKeyboardHandlers() {
        const kb = scene.input.keyboard;
        // Left/Right arrows and A/D keys move selection across available chunks
        const leftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        const rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        const aKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        const dKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        const stepLeft = () => { if (isSelectionActive) stepSelection(-1); };
        const stepRight = () => { if (isSelectionActive) stepSelection(1); };
        // Helpers to check if any of the keys for a direction are currently held
        const isLeftDown = () => leftKey.isDown || aKey.isDown;
        const isRightDown = () => rightKey.isDown || dKey.isDown;
        // Start/stop repeat timers
        const startLeftHold = () => {
            if (leftHoldTimer) return;
            // Initial delay before fast repeat
            leftHoldTimer = scene.time.addEvent({
                delay: 250,
                callback: () => {
                    if (!isSelectionActive || !isLeftDown()) { stopLeftHold(); return; }
                    // Start fast repeat
                    stopLeftHold();
                    leftHoldTimer = scene.time.addEvent({
                        delay: 120,
                        loop: true,
                        callback: () => {
                            if (!isSelectionActive || !isLeftDown()) { stopLeftHold(); return; }
                            stepLeft();
                        }
                    });
                }
            });
        };
        const startRightHold = () => {
            if (rightHoldTimer) return;
            rightHoldTimer = scene.time.addEvent({
                delay: 250,
                callback: () => {
                    if (!isSelectionActive || !isRightDown()) { stopRightHold(); return; }
                    stopRightHold();
                    rightHoldTimer = scene.time.addEvent({
                        delay: 120,
                        loop: true,
                        callback: () => {
                            if (!isSelectionActive || !isRightDown()) { stopRightHold(); return; }
                            stepRight();
                        }
                    });
                }
            });
        };
        const stopLeftHold = () => { if (leftHoldTimer) { leftHoldTimer.remove(); leftHoldTimer = null; } };
        const stopRightHold = () => { if (rightHoldTimer) { rightHoldTimer.remove(); rightHoldTimer = null; } };

        // Single-step on initial key down
        leftKey.on('down', () => { stepLeft(); startLeftHold(); });
        aKey.on('down', () => { stepLeft(); startLeftHold(); });
        rightKey.on('down', () => { stepRight(); startRightHold(); });
        dKey.on('down', () => { stepRight(); startRightHold(); });
        // Stop repeat when all keys for that direction are released
        leftKey.on('up', () => { if (!isLeftDown()) stopLeftHold(); });
        aKey.on('up', () => { if (!isLeftDown()) stopLeftHold(); });
        rightKey.on('up', () => { if (!isRightDown()) stopRightHold(); });
        dKey.on('up', () => { if (!isRightDown()) stopRightHold(); });
        const enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enterKey.on('down', () => { if (isSelectionActive) confirm(); });
        keyboardHandlers.push(leftKey, rightKey, aKey, dKey, enterKey);
    }

    function stepSelection(dir) {
        if (availableChunkIndices.length === 0) return;
        // If nothing selected yet, pick nearest to camera center
        if (highlightedChunkIndex === -1) {
            const cam = scene.cameras.main;
            const centerX = cam.midPoint.x;
            let bestIdx = availableChunkIndices[0];
            let bestDist = Math.abs(getTurretPositionForChunk(chunks[bestIdx]).x - centerX);
            for (const idx of availableChunkIndices) {
                const d = Math.abs(getTurretPositionForChunk(chunks[idx]).x - centerX);
                if (d < bestDist) { bestDist = d; bestIdx = idx; }
            }
            highlightedChunkIndex = bestIdx;
        } else {
            const curPos = availableChunkIndices.findIndex(i => i === highlightedChunkIndex);
            const nextPos = (curPos + (dir < 0 ? -1 : 1) + availableChunkIndices.length) % availableChunkIndices.length;
            highlightedChunkIndex = availableChunkIndices[nextPos];
        }
        const pos = getTurretPositionForChunk(chunks[highlightedChunkIndex]);
        scene.cameras.main.pan(pos.x, pos.y, 500, 'Power2');
        clearPreview();
        createPreview(highlightedChunkIndex);
    }

    function confirm() {
        if (highlightedChunkIndex === -1) { trace('⌨️ No chunk selected'); return; }
        info(`⌨️ Player ${player.name} confirmed chunk ${highlightedChunkIndex}`);
        clearPreview();
        finalize(highlightedChunkIndex);
    }

    function createPreview(idx) {
        const pos = getTurretPositionForChunk(chunks[idx]);
        previewTurret = createGunTurret(scene, pos.x, pos.y, player.team);
        previewTurret.setAlpha(0.7);
        previewTurret.disableInteractive();
        previewTurret.setDepth(100);
    }

    function clearPreview() { if (previewTurret) { previewTurret.destroy(); previewTurret = null; } }

    function finalize(idx) {
        if (!isSelectionActive) return;
        isSelectionActive = false;
        const pos = getTurretPositionForChunk(chunks[idx]);
        cleanup();
        callbacks.onBaseSelected(idx, pos);
    }

    function cleanup() {
        clearHighlight();
        clearPreview();
        if (leftHoldTimer) { leftHoldTimer.remove(); leftHoldTimer = null; }
        if (rightHoldTimer) { rightHoldTimer.remove(); rightHoldTimer = null; }
        keyboardHandlers.forEach(k => k?.destroy?.());
        if (pointerMoveHandler) scene.input.off('pointermove', pointerMoveHandler);
        if (pointerDownHandler) scene.input.off('pointerdown', pointerDownHandler);
        window.removeEventListener('resize', resizeHandler);
        if (currentPanel) { hideBaseSelectionPanel(currentPanel); currentPanel = null; }
        scene.activeBaseSelectionCleanup = null;
        // Restore previous cursor
        if (scene && scene.game && scene.game.canvas) {
            scene.game.canvas.style.cursor = prevCursor || 'default';
        }
    }
}

/**
 * Initialize base selection for teleportation (single player)
 * @param {Scene} scene - The Phaser scene instance with custom properties
 * @param {GameState} gameState - Current game state
 * @returns {Promise<{chunkIndex: number, basePosition: Object}>} Promise that resolves with selected base data
 */
export function initializeTeleportBaseSelection(scene, gameState) {
    info('🔄 Starting teleport (chunk) base selection...');
    return new Promise((resolve, reject) => {
        const chunks = scene.landscapeData?.chunks;
        if (!chunks) {
            logError('❌ No chunks available in scene');
            return reject(new Error('No chunks available'));
        }
        const currentPlayerNum = getCurrentPlayer(gameState);
        const currentPlayerKey = `player${currentPlayerNum}`;
        const playerName = scene.playerData?.[currentPlayerNum - 1]?.name || `Player ${currentPlayerNum}`;
        /** @type {PlayerData} */
        const mockPlayer = { id: currentPlayerKey, name: playerName, team: currentPlayerKey, chunkIndex: null, health: 100, turret: null };
        const occupied = [];
        for (let i = 1; i <= gameState.numPlayers; i++) {
            const pKey = `player${i}`; const ps = gameState[pKey];
            if (ps.health <= 0 || !gameState.playersAlive.includes(i)) continue;
            if (ps.chunkIndex !== null && ps.chunkIndex !== undefined) occupied.push(ps.chunkIndex);
        }
        const availableChunkIndices = listSelectableChunkIndices(chunks, occupied);
        if (availableChunkIndices.length === 0) {
            warn('🚫 No available chunks for teleportation');
            return reject(new Error('No available chunks for teleportation'));
        }
        startSinglePlayerChunkSelection(scene, mockPlayer, chunks, availableChunkIndices, {
            onBaseSelected: (chunkIndex, pos) => { info(`✅ Teleport chunk selected: ${chunkIndex}`); resolve({ chunkIndex, basePosition: { x: pos.x, y: pos.y + 20 } }); },
            onCancelled: () => { info('🚫 Teleport base selection cancelled'); reject(new Error('Teleport cancelled by user')); }
        }, true);
    });
}
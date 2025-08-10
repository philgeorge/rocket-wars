// baseSelection.js
// Base selection stage logic for Rocket Wars

import { createGunTurret } from './turret.js';
import { createBaseSelectionPanel, hideBaseSelectionPanel, positionBaseSelectionPanel } from './ui/index.js';
import { getTeamColorCSS } from './constants.js';
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
    let highlights = [];
    let currentPanel = createBaseSelectionPanel(scene, player);
    positionBaseSelectionPanel(currentPanel, scene.cameras.main.width, isTeleportMode);
    let keyboardSelectedChunkIndex = -1;
    let previewTurret = null;
    let isSelectionActive = true;
    const keyboardHandlers = [];

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

    drawHighlights();
    setupPointerHandlers();
    setupKeyboardHandlers();

    function drawHighlights() {
        clearHighlights();
        const playerColorHex = parseInt(getTeamColorCSS(player.team).replace('#', ''), 16);
        availableChunkIndices.forEach(idx => {
            const chunk = chunks[idx];
            if (!chunk) return;
            const pos = getTurretPositionForChunk(chunk);
            const g = scene.add.graphics();
            g.lineStyle(4, playerColorHex, 0.8);
            g.fillStyle(playerColorHex, 0.2);
            g.fillCircle(pos.x, pos.y, 30);
            g.strokeCircle(pos.x, pos.y, 30);
            const hitArea = new Phaser.Geom.Circle(pos.x, pos.y, 35);
            g.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
            g.input.cursor = 'pointer';
            g.setDepth(500);
            highlights.push(g);
            trace(`✨ Highlight chunk ${idx} @ (${pos.x}, ${pos.y})`);
        });
    }

    function clearHighlights() {
        highlights.forEach(h => { if (h && h.scene) h.destroy(); });
        highlights = [];
    }

    function setupPointerHandlers() {
        availableChunkIndices.forEach((idx, i) => {
            const g = highlights[i];
            if (!g) return;
            let hoverTimeout = null;
            let hovering = false;
            g.on('pointerdown', () => {
                if (!isSelectionActive) return;
                finalize(idx);
            });
            g.on('pointerover', () => {
                if (!isSelectionActive || hovering) return;
                hovering = true;
                if (keyboardSelectedChunkIndex === -1) {
                    if (hoverTimeout) clearTimeout(hoverTimeout);
                    hoverTimeout = setTimeout(() => {
                        if (keyboardSelectedChunkIndex === -1 && hovering && isSelectionActive) {
                            clearPreview();
                            createPreview(idx);
                        }
                        hoverTimeout = null;
                    }, 50);
                }
            });
            g.on('pointerout', () => {
                hovering = false;
                if (hoverTimeout) { clearTimeout(hoverTimeout); hoverTimeout = null; }
                if (keyboardSelectedChunkIndex === -1) clearPreview();
            });
        });
    }

    function setupKeyboardHandlers() {
        const kb = scene.input.keyboard;
        const tabKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        tabKey.on('down', () => { if (isSelectionActive) cycleNext(); });
        const enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enterKey.on('down', () => { if (isSelectionActive) confirm(); });
        keyboardHandlers.push(tabKey, enterKey);
    }

    function cycleNext() {
        if (availableChunkIndices.length === 0) return;
        const curIdx = availableChunkIndices.findIndex(i => i === keyboardSelectedChunkIndex);
        const next = (curIdx + 1) % availableChunkIndices.length;
        keyboardSelectedChunkIndex = availableChunkIndices[next];
        trace(`⌨️ Cycling to chunk ${keyboardSelectedChunkIndex}`);
        const pos = getTurretPositionForChunk(chunks[keyboardSelectedChunkIndex]);
        scene.cameras.main.pan(pos.x, pos.y, 500, 'Power2');
        clearPreview();
        createPreview(keyboardSelectedChunkIndex);
    }

    function confirm() {
        if (keyboardSelectedChunkIndex === -1) { trace('⌨️ No chunk selected'); return; }
        info(`⌨️ Player ${player.name} confirmed chunk ${keyboardSelectedChunkIndex}`);
        clearPreview();
        finalize(keyboardSelectedChunkIndex);
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
        clearHighlights();
        clearPreview();
        keyboardHandlers.forEach(k => k?.destroy?.());
        window.removeEventListener('resize', resizeHandler);
        if (currentPanel) { hideBaseSelectionPanel(currentPanel); currentPanel = null; }
        scene.activeBaseSelectionCleanup = null;
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
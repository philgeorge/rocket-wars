// chunkBaseHelpers.js
// Helpers for chunk-based base selection & placement.

import { trace } from './logger.js';

/**
 * Get turret placement position for a given terrain chunk.
 * @param {{x:number,y:number,width:number}} chunk
 * @returns {{x:number,y:number}}
 */
export function getTurretPositionForChunk(chunk) {
    return {
        x: chunk.x + chunk.width / 2,
        y: chunk.y - 25 // match prior offset used when placing on flat base
    };
}

/**
 * Determine if a chunk is selectable for base placement.
 * Basic Phase 1 rules: not destroyed, sufficient height.
 * @param {any} chunk
 * @returns {boolean}
 */
export function isChunkSelectable(chunk) {
    if (!chunk) return false;
    if (chunk.destroyed) return false;
    if (chunk.height <= 15) return false; // too small / nearly gone
    return true;
}

/**
 * Build list of selectable chunk indices excluding occupied ones.
 * @param {any[]} chunks
 * @param {number[]} occupiedIndices
 * @returns {number[]}
 */
export function listSelectableChunkIndices(chunks, occupiedIndices = []) {
    const set = new Set(occupiedIndices);
    const result = [];
    for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        if (isChunkSelectable(c) && !set.has(i)) {
            result.push(i);
        }
    }
    trace(`🧱 Selectable chunks: ${result.length}/${chunks.length} (occupied: [${occupiedIndices.join(', ')}])`);
    return result;
}

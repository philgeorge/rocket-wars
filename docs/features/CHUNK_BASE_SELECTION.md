# Chunk-Based Base Selection Refactor

## Status
Draft (planning before implementation)

## Motivation
Current base placement relies on precomputed `flatBases` derived from landscape point runs that were flattened after generating alternating flat/mountain sections. With the move to a fully chunked terrain system (and recent alignment of chunk width to 40px = turret width), retaining a separate flat base abstraction:
- Duplicates data already implicit in `chunks`.
- Complicates teleport & falling logic (need to map between base indices and chunk indices / coordinates).
- Adds maintenance overhead as terrain destruction only modifies chunks.

Switching to chunk-based selection simplifies logic: a player's base is just the index of a supporting chunk.

## High-Level Goals
1. Remove dependency on `flatBases` for base selection, teleportation, and turret placement.
2. Represent a base location as a single chunk index (or later, multi-chunk span if needed) stored in `player.baseIndex` (redefined) or renamed field.
3. Reuse/destructively update existing falling/support logic without coordinate conversions.
4. Preserve or improve user experience of base selection (visual highlights, keyboard navigation, teleport re-selection).
5. Keep backwards compatibility path (temporary) to allow rollback if needed.

## Out-of-Scope (Phase 1)
- Removing `flatBases` generation from `generateLandscapePoints` (can be cleaned later once stable).
- Advanced suitability scoring (slope analysis, neighbor smoothing).
- Multi-chunk wide bases.
- Saving migrations for existing persisted game states (fresh sessions only).

## Data Model Changes
| Field | Old Meaning | New Meaning |
|-------|-------------|-------------|
| `player.baseIndex` | Index into `flatBases` array | Index into `landscapeData.chunks` array |

Types update: Clarify doc comment; keep name initially to avoid large diff, rename later if desired (`chunkIndex`).

## Selection Rules (Initial)
A chunk is selectable if:
- `destroyed === false`
- `height > 15` (prevents nearly-gone chunks)
- Not already occupied by another living player's base

Optional (deferred) filters:
- Neighbor delta threshold (|chunk.y - neighbor.y| < X)
- Min support span (check adjacent chunks to ensure at least N contiguous selectable chunks)

## Placement Coordinates
For chunk `c`:
```
Turret.x = c.x + c.width / 2
Turret.y = c.y - 25   // existing vertical offset from prior base logic
```
Consistent with current support checks (turret bottom assumed at y+25).

## Refactor Plan (Phases A–E)
### A. Helpers
Add small pure functions:
- `getTurretPositionForChunk(chunk)` -> `{ x, y }`
- `listSelectableChunkIndices(chunks, gameState)` -> `number[]`
- (Optional) `isChunkSelectable(chunk, occupiedIndices)`

### B. Base Selection (initial & teleport)
Replace usage of `flatBases` in `baseSelection.js`:
- Accept `chunks` instead of `flatBases`.
- Build `availableChunks` from helper.
- Highlight & preview: use chunk center coordinate.
- Keyboard cycling indexes into `availableChunks`.

### C. Turret Placement & Teleport
- `placeTurretsOnBases` -> new `placeTurretsOnChunks` (leave old function wrapper calling new for transitional compatibility, or inline replace).
- Teleport selection & `handleTeleportBaseSelected` use chunk indices.

### D. Types & State
Update `types.d.ts` doc comment for `baseIndex` to indicate chunk index. (Optionally add TODO to rename.)

### E. Cleanup / Compatibility
- For one release keep `flatBases` generation but ignore it (log once that chunk-based mode active).
- After validation, remove `flatBases` references & generation branch.

## Acceptance Criteria
- Game starts; players can select any valid chunk; turrets spawn correctly aligned.
- Teleport mode lists only remaining non-destroyed, non-occupied chunks.
- Destroying supporting chunks and falling still works (support calc unchanged).
- No references remain that rely on `flatBases` for logic (only allowed in deprecated comments/logs).
- Lint passes.

## Testing Strategy
Manual / lightweight automated:
1. Start game 2–4 players, select widely spaced chunks.
2. Fire at terrain under a turret until fall triggers; verify baseIndex still correctly maps to chunk center.
3. Teleport and ensure old chunk becomes free, new chunk occupied.
4. Attempt teleport after destroying many chunks (ensure only viable shown).

Potential future unit tests (deferred): pure helper tests for `isChunkSelectable`, position calculation.

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Existing code silently still uses flatBases somewhere | Grep for `flatBases` after refactor; fail build if found in logic paths |
| baseIndex meaning confusion | Inline comment + TODO rename; add log on first placement |
| Edge chunks produce awkward placement | Optional post-adjustment to shift inward if at extreme edges |
| Destroyed chunk still referenced by player | On update loop, validate each player’s chunk still selectable; if not, trigger re-selection or falling logic |

## Future Enhancements (Not Phase 1)
- Multi-width bases spanning 2–3 chunks for large structures.
- Dynamic suitability scoring (wind exposure, elevation advantage).
- Procedural removal of unnatural narrow spires before selection.
- Visual mini-map of chunk occupancy.

## Implementation Order & Branching
1. Commit this design doc.
2. Implement helpers + new placement function.
3. Switch selection logic.
4. Switch teleport logic.
5. Update types + transitional logging.
6. Remove dead code & references.

## Rollback Plan
Keep old `flatBases` code untouched until end. If issues arise, toggle a temporary feature flag (e.g., `USE_CHUNK_BASE_SELECTION`) to revert calls to legacy path.

---
Draft ready for review. After confirmation, will proceed with Phase 1 implementation.

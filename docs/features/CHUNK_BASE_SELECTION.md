# Chunk-Based Base Selection Refactor

## Status
Completed (Implemented & merged to main on 2025-08-10)

## Motivation
Originally, base placement relied on precomputed `flatBases` derived from landscape point runs. The system is now fully chunk-based (chunk width = 40px = turret width). Retaining a separate flat base abstraction previously:
- Duplicates data already implicit in `chunks`.
- Complicates teleport & falling logic (need to map between base indices and chunk indices / coordinates).
- Adds maintenance overhead as terrain destruction only modifies chunks.

Switching to chunk-based selection simplifies logic: a player's base is just the index of a supporting chunk.

## High-Level Goals
1. Remove dependency on `flatBases` for base selection, teleportation, and turret placement. (DONE)
2. Represent a base location as a single chunk index stored in `player.chunkIndex` (renamed from baseIndex). (DONE)
3. Reuse/destructively update existing falling/support logic without coordinate conversions.
4. Preserve or improve user experience of base selection (visual highlights, keyboard navigation, teleport re-selection).
5. Keep backwards compatibility path (temporary) to allow rollback if needed. (SUPERSEDED – legacy path removed after validation)

## Out-of-Scope (Phase 1)
- Advanced suitability scoring (slope analysis, neighbor smoothing).
- Multi-chunk wide bases.
- Saving migrations for existing persisted game states (fresh sessions only).

## Data Model Changes
| Field | Old Meaning | New Meaning |
|-------|-------------|-------------|
| `player.chunkIndex` (was `baseIndex`) | Index into `flatBases` array | Index into `landscapeData.chunks` array |

The rename to `chunkIndex` has been completed across runtime code and types.

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

## Refactor Plan vs Implementation
| Phase | Description | Status |
|-------|-------------|--------|
| A | Helpers (`getTurretPositionForChunk`, `listSelectableChunkIndices`, `isChunkSelectable`) | DONE (all implemented; `isChunkSelectable` simple form used) |
| B | Base selection & teleport use chunks | DONE |
| C | Turret placement uses chunks (`placeTurretsOnChunks`), legacy removed | DONE |
| D | Types updated & field renamed to `chunkIndex` | DONE |
| E | Remove flat base generation & references | DONE (flatBases fully removed) |

## Acceptance Criteria
All acceptance criteria have been met:
- Game starts; players select valid chunks; turrets align correctly.
- Teleport mode filters destroyed/occupied chunks.
- Falling/support logic unchanged and compatible (relies on chunk data).
- No production logic references to `flatBases` remain.
- Lint passes clean.

## Testing Strategy
Manual / lightweight automated:
1. Start game 2–4 players, select widely spaced chunks.
2. Fire at terrain under a turret until fall triggers; verify chunkIndex still correctly maps to chunk center.
3. Teleport and ensure old chunk becomes free, new chunk occupied.
4. Attempt teleport after destroying many chunks (ensure only viable shown).

Potential future unit tests (deferred): pure helper tests for `isChunkSelectable`, position calculation.

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Existing code silently still uses flatBases somewhere | (Resolved) Removed generators & references |
| baseIndex meaning confusion | (Resolved) Renamed to chunkIndex |
| Edge chunks produce awkward placement | Optional post-adjustment to shift inward if at extreme edges |
| Destroyed chunk still referenced by player | TODO: Add periodic validation & UI feedback |

## Future Enhancements (Not Phase 1)
- Multi-width bases spanning 2–3 chunks for large structures.
- Dynamic suitability scoring (wind exposure, elevation advantage).
- Procedural removal of unnatural narrow spires before selection.
- Visual mini-map of chunk occupancy.

## Remaining TODOs / Nice-to-Haves
1. Add runtime validation that a player's `chunkIndex` still points to a non-destroyed, sufficiently tall chunk; if invalid, trigger re-selection or mark player as falling/needs relocation.
2. Optional advanced filters (neighbor slope, contiguous span) before exposing chunks in selection UI.
3. Visual differentiation for recently destroyed vs intact neighboring chunks during teleport selection.
4. Add unit tests for helper functions (`isChunkSelectable`, `listSelectableChunkIndices`, position calc) to lock behavior.
5. Consider mild inward shift for extreme edge chunks (reduce off-screen risk).
6. Future enhancement list (multi-chunk bases, scoring, mini-map) remains open.

## Rollback Plan
No longer applicable: legacy flat base path removed. Re-introduction would require restoring prior generator & selection code (not planned).



# Turret Teleport Feature

This is a feature that allows the user to move their turret to a different base, instead of taking a shot. The purpose of this is to avoid a player being trapped in a location that's easy for others to hit, or a location that's out of range of other players and therefore cannot get involved in shooting.

## Controls

- **Initiate teleport by keyboard**: Press "T" key
- **Initiate teleport by UI button**: Click the "T" button in the environment panel
- **Cancel teleport mode**: Press "ESC" key to exit teleportation mode without moving. Player can use remaining turn time to take a shot instead.

## Behavior

- The game enters "base selection" mode - this is exactly the same as is currently used at the start of the game, except it's just done for the player whose turn it is
- The turn timer continues to count down during teleport base selection, therefore the base selection panel should be displayed lower down on the screen, so that it doesn't overlap the environment and player stats panels. If the timer runs out without the player selecting a new base, then they have wasted their turn as it passes to the next player (or the game ends)
- If the player has selected a new base, then their turn ends

## Implementation Plan

This feature requires integration with multiple existing systems and should be implemented in discrete steps to ensure safety and proper testing:

### Step 1: Add T key detection to keyboard input system ✅
- Extend `keyboardInput.js` to detect "T" key press during active player turns
- Add T key handling to the input manager's update loop
- Prevent T key activation during aiming mode or when game is ended
- Log T key presses for verification

### Step 2: Add teleport button to environment panel ✅
- Create interactive "T" button in the top-left environment panel using `panelFactory.js`
- Ensure button is only clickable during active player turns (not during aiming, projectile flight, or game end)
- Button should trigger the same teleport initiation as the T key

### Step 3: Create turret teleport state management ✅
- Add teleport mode state to the game state object in `turnManager.js`
- Add functions to enter/exit teleport mode for the current player
- Ensure teleport mode blocks shooting and normal aiming
- Integrate with existing turn timer (continues counting during teleport)
- Handle ESC key cancellation to exit teleport mode and return to normal turn

### Step 4: Modify base selection system for mid-game teleportation ✅
- Extract reusable functions from `baseSelection.js` for single-player base selection
- If needed, create new function to handle teleport base selection (only current player, different panel positioning)
- Adapt base availability logic to exclude occupied bases during teleport
- Ensure base selection panel positions lower on screen to avoid UI overlap

### Step 5: Implement turret movement and turn ending ✅
- End current player's turn when teleport is completed (similar to shooting)
- Properly cancel base selection when teleport mode is exited via T button, T key, or ESC key (player can continue with remaining turn time)
- Ensure base selection highlights and UI are cleaned up when cancelling teleport mode
- Verify turret movement integration works correctly with turn management

### Step 6: Handle edge cases and integration testing ✅
- Prevent teleport to the same base the turret is already on
- Handle teleport timeout (turn timer runs out) by advancing to next player without moving
- Test interaction with projectile collisions and game end conditions
- Verify teleport works correctly with 2, 3, and 4 player games
- Test that "T" button in environment panel works identically to T key press

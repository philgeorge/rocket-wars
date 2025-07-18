# Accessibility Enhancements

This is a list of accesibility enhancements that will make the game easier to interact with.
They should be implemented one at a time.

## Base Selection using keyboard ✅

- Currently the base selection step of game setup can only be achieved by mouse click (or screen taps). The instructions tell the user to "Click a {colour} circle to position your base".
- All available bases should still be shown by coloured circles and the current landscape scrolling and base clicking behaviour should be retained. 
- Whilst the game is in "base selection" state, capture the Tab and Enter keys.
- Pressing Tab key should cycle through selection from the available flat bases.
- Show each slected base by moving the camera to it.
- Show the player's turret placed in the selected base.
- Pressing Enter key confirms that the selected base is the user's choice. (This is the same as current behaviour of clicking on a circle.)
- Update the on-screen instruction to include "or use Tab and Enter keys."

## Instructions for first aim and shot ✅

- Use a panel similar to the base selection panel, with a message:
  Aim by clicking or dragging,
  or by Enter and arrow keys.
  Release mouse/touch or Enter again to fire!
  ESC key to cancel aiming.
- Should record in application storage that the aiming instructions have been shown so that it's not shown every time (once overall is enough, not needed for each player separately)

## Keyboard control of shot aiming

**Step 1: Add keyboard aiming state management** ✅
- Add keyboard aiming state properties to turret objects: `isKeyboardAiming`, `keyboardAngle`, `keyboardPower`
- Each turret stores its own keyboard aiming preferences throughout the game session
- Initialize keyboard aiming with sensible defaults (45°, 50% power) - no localStorage needed since turrets persist

**Step 2: Implement Enter key to start/stop aiming** ✅
- In `camera.js`, add Enter key detection when no turret is actively aiming
- When Enter is pressed, find the current player's turret and start keyboard aiming mode
- Set `scene.currentPlayerTurret` and call `startKeyboardAiming()` method
- When Enter is pressed again during aiming, end aiming and launch projectile (same as mouse release)

**Step 3: Create keyboard aiming method** ✅
- Add `startKeyboardAiming()` method to turret objects in `turret.js`
- Initialize aiming with stored/default angle and power values
- Show aiming line and tooltip immediately with initial values
- Set `isKeyboardAiming = true` to distinguish from mouse aiming

**Step 4: Implement arrow key controls for angle and power** ✅
- In the game update loop, detect arrow key presses when `isKeyboardAiming` is true
- Left/Right arrows (A/D keys): adjust angle in 1-degree increments
- Up/Down arrows (W/S keys): adjust power in 1% increments
- Implement key hold detection for faster adjustment (increase rate after 500ms hold)
- Maintain the same restrictions: angle -180° to 0°, power 10-100%

**Step 5: Update visual feedback for keyboard aiming**
- Modify `updateAim()` method to work with keyboard-provided angle/power values
- Ensure aiming line color and tooltip update correctly with keyboard input
- Use the same visual feedback system as mouse aiming for consistency

**Step 6: Add ESC key to cancel aiming**
- Detect ESC key press during keyboard aiming
- Cancel aiming without shooting (similar to mouse interruption)
- Clear `scene.currentPlayerTurret` and return to camera scroll mode
- Hide aiming line and tooltip

**Step 7: Integrate with existing camera controls**
- Modify `updateKeyboardCamera()` to disable camera movement during keyboard aiming
- Ensure arrow keys control aiming instead of camera when `scene.currentPlayerTurret` exists
- Maintain smooth transition between camera movement and aiming modes

**Step 8: Update aiming preferences after shooting**
- When projectile is fired via keyboard aiming, update the turret's stored angle and power
- Store the final angle and power values in the turret object for next turn
- No localStorage needed since turrets persist throughout the game session

**Step 9: Add keyboard aiming indicators**
- Consider adding visual indicators to show keyboard aiming mode is active
- Possibly modify the existing aiming instructions panel to include keyboard controls
- Ensure tooltip shows current angle/power values during keyboard aiming

**Step 10: Test and refine**
- Test keyboard aiming with different screen sizes and resolutions
- Verify angle/power calculations match mouse aiming behavior
- Ensure smooth integration with existing turn-based mechanics
- Test key hold behavior for rapid adjustment
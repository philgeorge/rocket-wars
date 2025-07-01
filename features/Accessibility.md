# Accessibility Enhancements

This is a list of accesibility enhancements that will make the game easier to interact with.
They should be implemented one at a time.

## Base Selection using keyboard

- Currently the base selection step of game setup can only be achieved by mouse click (or screen taps). The instructions tell the user to "Click a {colour} circle to position your base".
- All available bases should still be shown by coloured circles and the current landscape scrolling and base clicking behaviour should be retained. 
- Whilst the game is in "base selection" state, capture the Tab and Enter keys.
- Pressing Tab key should cycle through selection from the available flat bases.
- Show each slected base by moving the camera to it.
- Show the player's turret placed in the selected base.
- Pressing Enter key confirms that the selected base is the user's choice. (This is the same as current behaviour of clicking on a circle.)
- Update the on-screen instruction to include "or use Tab and Enter keys."

## Instructions for first aim and shot

- Use a panel similar to the base selection panel, with a message:
  Aim by clicking or dragging,
  or by Enter and arrow keys.
  Release mouse/touch or Enter again to fire!
  ESC key to cancel aiming.
- Should record in application storage that the aiming instructions have been shown so that it's not shown every time (once overall is enough, not needed for each player separately)

## Keyboard control of shot aiming

- User can already scroll the landscape with either arrow or keys.
- Pressing Enter key should start the aiming process.
- Once the aiming process has started, up and down arrow keys (or W and S) increase or decrease the power; left and right arrows (or A and D) adjust the angle.
- Power and Aim should be restricted in the exact same way as with under mouse control: 0-90° angle and 10-100% power.
- If any of those keys are held down, then the aim or power should change more quickly.
- Pressing the Enter key again should end aiming and launch the projectile.
- Pressing the ESC key during aiming should cancel the aiming process. This gives the player the chance to scroll around the landscape again if they need.
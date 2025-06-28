# Rounds and Turns Feature

## Feature Overview

Currently the game implementation allows any player's turret to be fired at any time. Instead,
each player should take turns to fire their projectiles. When all players have taken a turn, then a round has been completed.
There will be a limited number of rounds played.
The game ends when either only one player is left alive or all rounds have been completed. The winner is the remaining player with the highest health level.
This will make for a fair and orderly game where each player has an equal chance.

## Feature Breakdown

### Game setup ✅
The initial game setup needs the following additional fields:
- "Turn Time": range selector from 10 to 100 seconds in 5 second intervals, default 30.
- "Rounds": range selector from 5 to 25, intervals of 1, default 10
Add these fields to the input form after "Number of Players" but before wind and gravity.
Ensure that all these fields are also stored and loaded from the browser application storage.

### Game State Structure ✅
Extend the game state object to track rounds and turns:
- Add `currentRound` (starting at 1)
- Add `maxRounds` (from game setup config)
- Add `currentPlayerIndex` (0-based index into active players)
- Add `playersAlive` (array of player numbers still in the game)
- Add `turnTimeLimit` (from game setup config)
- Add `turnStartTime` (timestamp when current turn began)
- Add `hasPlayerFiredThisTurn` (boolean to prevent multiple shots per turn)
- Add helper functions for turn management and game state queries

Check if any similar state already exists that can be used.

### Turn System ✅
Implement the core turn management mechanics:
- Create function to advance to next player's turn
- Create function to advance to next round
- Create function to check if game should end (one player left or max rounds reached)
- Integrate turn system with existing projectile firing mechanism
- Restrict firing to only the active player's turret
- Handle turn transitions after projectile impact and damage processing

### Start of each Round ✅
- The round number should be clearly displayed. Replace the environment panel title "ENVIRONMENT" with "ROUND {n}".
- Calculate the new randomly adjusted wind strength and update this in the environment panel. This is currently being done after every time a shot is fired.

### Start of each Turn
- The order of players turns is the natural order of players 1,2,3,4, the same as used in base selection.
- Move the camera to focus on the player whose turn it is. (After the previous turn has ended, including any projectile flight, impact and damage/kill processing.)
- Update the player stats panel to highlight the name of the player whose turn it is. This could be done by dimming/unbolding the text colour of the other players and their health, and bolding the name and health of the current player.
- Only the active player (whose turn it is) may fire a projectile from their turret. Therefore restrict the aiming and firing mechanic to only the the single applicable turret.

### Time limit
- A turn for each individual player is limited to the duration set in game setup. During this time they can scroll around the map, aim, and fire once.
- Don't allow the player to fire a second projectile within the same turn.
- The timer countdown shoud be shown in the "environment" panel as a new, third line, e.g.: "Time: 29s". Update every second.
- After the payer fires (i.e. has launched the projectile) the timer countdown stops. The flight of the projectile isn't included within the time limit.
- The countdown shouldn't pause if the browser tab loses focus or is minimised. (Is this possible?)

### End of each Turn
- If the timer reaches 0 without the player firing a projectile, then that player' turn ends.
- If a player launches a projectile, then the countdown stops, but we continue to watch that projectile and its collision/impact before the turn has ended. (Projectile motion, camera tracking and collision detection need not be changed from current behaviour.)
- After the player's turn has ended, proceed to the next player, or if all players have taken their turn, then proceed to the next round.

### Player kills/deaths
- If the projectile fired during a turn has reduced any player's health to 0, then that player has been killed.
- Remove any killed player's turret from the map.
- Any killed player is skipped from any further rounds of the game.
- There is no renumbering of players after a kill, so for example if player 2 is the first to be killed, then the game continues with players 1, 3, 4.
- The current round continues with remaining players (if there are more than 1).

### End of Game
- If, after a kill, only one player remains, the the game ends.
- If all rounds (as per the game setup config) have been completed and there is still more than 1 player alive, then the game ends.
- When the game ends, present a "Results" panel that floats over the landscape.
- All players should be listed in this order: primarily by alive > killed, then by remaining health.
- Include remaining health % alongside each player's name.
- Behind the results panel, move the camera to focus on the player who is the winner (number 1 in results list).
- Put a button on the bottom of the results panel that restarts the game (could simply refresh the page).
- The results panel should be locked from scrolling (like the other panels) but still allow mouse input to drag scroll the landscape behind the panel.

## Future Enhancement Ideas

- Rotating "active player" arrow next to active player's name
- Screen border colour matching active player's colour
- Allow player to teleport turret to another flat base (including bases vacated by killed players) instead of taking a shot within their turn


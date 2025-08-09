High level tracking of time spent developing this game.

# Actual Timeline (2025)

## 11 May, 2 hours

- Share game idea with copilot, discuss tech options
- Capture everything in GameDesignDocument.md

## 18 May, 2 hours

- Get project created, add phaser library
- Draw landscape, with flat bits (buggy)
- Add to GitHub

## 8-9 June, 7 hours

2 days, lots of progress:
- Use proper phaser approach for viewport and scrolling
- Got aiming working with tooltip
- Some typing support in IDE by using Phaser TS file and JSDoc
- Initial game params entry form and floating status panel
- Allow 2-4 players
- Include copilot-instructions.md to influence copilot behaviour

## 10 June 2 hours
- Improve landscape size and detail based on number of players
- More IDE type warning fixes
- Restructure project to use "src" folder

## 11 June 2 hours
- Copied wind changing code from AGL laptop which I couldn't commit
- Style/sizing improvements on aiming tooltip and game info panel

## 15 June 2 hours
- Deploying to Github Pages
- Camera tracking of projectiles
- Replace debris with explosions and variable damage

## 20 June 3 hours
- got agent to create Refactors.md suggestions
- asked to apply top priority items, but I didn't like how it did it
- it removed logging and comments that were useful, not execessive
- it extracted constants first to a separate file, then to the top of each module, I just wanted locally scoped "const" declarations
- separating the things worth keeping from those I didn't want became impossible so I discarded everything using git; maybe will return to this later
- split status panel into 2
- move aiming panel into top center

## 21 June 4 hours
- player naming and base positioning
- finally gave up on the "vibe" had to fix a bug myself

## 24 June 2 hours
- extracted camera.js from main.js
- removed unused file

## 25 June 1.5 hours
- extracting code out of the main game loop to other modules
- change base selection to use Phaser graphics instead of HTML overlay

## 26 June 2 hours
- mobile improvements: shrinking panels, momentum drag, etc

## 28,29 June 7 hours
- rounds and turns logic
- bug fixes
- performance improvements

## 13 July 2 hours
- accesibility: keyboard controls for base selection and aiming, plus instructions

## 15 July 2 hours
- turret energy level bar visualisation

## 18 July 2 hours
- keyboard aiming feature implementation

## 19 July 3 hours
- half of teleport feature implementation

## 20 July 5 hours
- remaining teleport feature

## 27 July, 3 August 5 hours
- chunked, desructible landscape, falling turrets

## 09 Augues, 3 hours
- switch to GPT5
- project folder re-org
- code refactoring as per AI suggestions
- added, configured eslint; clean up all files
- implemented logger module to replace all direct console access

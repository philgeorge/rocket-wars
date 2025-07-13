This file contains notes about my learnings from using an AI Agent to help me build this game.

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

# Odd Agent Behaviour

- Choosing technology and shaping the look of the game went very well. This is kind of like competitor analysis and market research for a product.
- Pretty early on I hit bugs that didn't seem to get fixed. For example, making at least 3 flat areas on the landscape, or being unable to scroll the browser window where the canvas element is. My agent kept trying, often trying the same thing, and telling me "I've found the issue", but ultimately it either didn't work or broke something else.
- Eventually only I could break it out of this scrolling issue loop by asking it how games in phaser.js normally handle the world area being bigger than the viewport. It told me that it should be handled with a totally different approach - the browser document should be set to the size of the viewport and the Phaser runtime will handle scrolling. This worked and I asked the Agent to help me update the GameDesignDocument.md file with guidance to use Phaser conventions and warn me if we're going down the wrong path.
- On one occassion the Agent hung for 15 minutes. When I stopped it the game files were in an intermediate state where it had changed some things, but not everything it wanted, and the game was completely broken. I had to manually bring the game back to a working state. Lesson: make Git commits after every significant Agent change that you're happy with.
- Agent decided to use "Simple Browser" and Python http.server even though I already had "live server" installed and running. I pointed this out and Agent corrected this.
- Agent tried to update this file! Fair enough, I have now added explicit instructions that tell it to leave this file for my own personal musings. Hopefully that is enough.
- When first implementing projectiles, it went through the steps adding a code module and integrating it, and then iterated, telling me "it looks like the projectile.js" file already exists. let me check its current content". I think this is when it needs to clear its context by "Summarizing conversation history" in the middle of actioning a single prompt.
- Without me realising it I found the same code (placement of the status panel) duplicated in 3 places, one of which was unused. I had to explicitly point this out and request refactoring to remove duplication.
- Asking about Github Pages deployment was confusing. Copilot didn't properly understand the Github settings and pushed me down the wrong path (keeping static games file in a subfolder). Then when it realised the problem and gave me options to fix, some of them were redundant, and another seemed really bad (keepng the html file in 2 places). I basically had to tell it the right solution and then it did it for me.
- Sometimes the agent corrupts files with its changes, identifies this, restores and tries again. I am wondering if this is more likely when I have the file open as it is editing?
- Eventually found a bug that the Agent couldn't fix. Scrolling the landscape during player setup wouldn't work by drag-drop, only by keyboard or mouse wheel. Agent kept trying elaborate things like overlays and adding extra event handlers. When I studied the code I could see that the `scene.input.on('pointerdown',...` handler was exiting early if the game was in setup mode. I just had to remove this check.
- Got Agent to confirm that all code in a file was unused and delete it. Although I had to ask it to check that - initially it was happy just to refactor the unused code, e.g. removing commented out stuff and unused parameters. The chat window listed "3 files changed", one of which was the deleted file. Out of habit, I clicked "Keep" indicating I want to retain all changes its made, and stop viewing differences. Unfortunately, the "Keep" action restored the deleted file to my project! So I had to manually delete again, then commit that with git.


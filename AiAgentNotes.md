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

# Odd Agent Behaviour

- Choosing technology and shaping the look of the game went very well. This is kind of like competitor analysis and market research for a product.
- Pretty early on I hit bugs that didn't seem to get fixed. For example, making at least 3 flat areas on the landscape, or being unable to scroll the browser window where the canvas element is. My agent kept trying, often trying the same thing, and telling me "I've found the issue", but ultimately it either didn't work or broke something else.
- Eventually only I could break it out of this scrolling issue loop by asking it how games in phaser.js normally handle the world area being bigger than the viewport. It told me that it should be handled with a totally different approach - the browser document should be set to the size of the viewport and the Phaser runtime will handle scrolling. This worked and I asked the Agent to help me update the GameDesignDocument.md file with guidance to use Phaser conventions and warn me if we're going down the wrong path.
- On one occassion the Agent hung for 15 minutes. When I stopped it the game files were in an intermediate state where it had changed some things, but not everything it wanted, and the game was completely broken. I had to manually bring the game back to a working state. Lesson: make Git commits after every significant Agent change that you're happy with.
- Agent decided to use "Simple Browser" and Python http.server even though I already had "live server" installed and running. I pointed this out and Agent corrected this.
- Agent tried to update this file! Fair enough, I have now added explicit instructions that tell it to leave this file for my own personal musings. Hopefully that is enough.
- When first implementing projectiles, it went through the steps adding a code module and integrating it, and then iterated, telling me "it looks like the projectile.js" file already exists. let me check its current content". I think this is when it needs to clear its context by "Summarizing conversation history" in the middle of actioning a single prompt.
- Without me realising it I found the same code (placement of the status panel) duplicated in 3 places, one of which was unused. I had to explicitly point this out and request refactoring to remove duplication.

This file contains notes about my learnings from using an AI Agent to help me build this game.

# Odd Agent Behaviour

I starter with GPT4 but switch to Claude Sonnet 4 after the first couple of days.

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
- Agent typically never initiates its own even simple refactorings. After it's finished I point out duplicate code with my next prompt and only then will it extract into a helper function.

# 9 August: GPT 5


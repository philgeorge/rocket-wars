# Copilot Instructions for Rocket Wars

Prefer pure functions over classes where possible.

Apply Single Responsibility principle to stop files from getting large. Each file handles one main game system

Use Javascript but wit JSDoc comments for type safety and IntelliSense.

Do not tell me to start python http.server or run the command yourself - I am using live server and will test changes with this.

If you are not sure something will work, or I tell you it's not working, then use `console.log` to add debugging information.

This is a Phaser.js game, so always prefer Phaser conventions over generic web development patterns. When in doubt, consult the Phaser.js documentation and maintain the existing code style.

Remember that changes we make should work in different browser window sizes and with different device input methods, e.g. mouse, track pad, touch.

Never modify AiAgentNotes.md or this file.

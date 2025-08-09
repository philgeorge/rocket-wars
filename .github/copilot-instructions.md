# Copilot Instructions for Rocket Wars

## General Guidelines

- Prefer pure functions over classes where possible.
- Use Javascript but with JSDoc comments for type safety and IntelliSense.
- This is a Phaser.js game, so always prefer Phaser conventions over generic web development patterns. When in doubt, consult the Phaser.js documentation and maintain the existing code style.

## Specific Instructions
1. Do not tell me to start python http.server or run the command yourself - I am using live server and will test changes with this.
2. If you are not sure something will work, or I tell you it's not working, then use `console.log` to add debugging information.
3. Use `npm run lint` to check for linting/syntax errors.
4. Never modify AiAgentNotes.md or this file.

## Code Duplication Prevention

Before creating new functions, ALWAYS:
1. Use semantic_search to look for existing similar functionality
2. Use grep_search to find functions with similar names or purposes
3. Consider if existing functions can be exported/refactored instead of duplicating logic
4. Follow DRY (Don't Repeat Yourself) principle strictly
5. If creating similar logic to existing code, ask yourself: "Can I reuse or extend existing code instead?"

# Copilot Instructions for Rocket Wars

## Project Overview
Rocket Wars is a 2D artillery game built with Phaser.js. Players control turrets and fire projectiles at each other across a destructible landscape.

## Technology Stack
- **Framework**: Phaser.js 3.x (JavaScript game framework)
- **Language**: JavaScript (ES6 modules)
- **Development**: TypeScript support via JSDoc annotations and jsconfig.json
- **Build**: No build system - direct browser execution
- **Server**: Local development with Live Server

## Architecture Guidelines

### Code Organization Principles
- **ES6 Modules**: Use `export`/`import` for all code modules
- **Phaser Conventions**: Follow Phaser.js patterns for scenes, game objects, and physics
- **Functional Approach**: Prefer pure functions over classes where possible
- **Single Responsibility**: Each file handles one main game system

## Coding Standards

### JavaScript Style
- Use `const`/`let` instead of `var`
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Add comprehensive JSDoc comments for functions
- Use descriptive variable names (e.g., `clampedAngle`, `powerPercent`)

### TypeScript Integration
- Use JSDoc annotations for type safety: `/** @type {Phaser.Scene} */`
- Leverage `jsconfig.json` for VS Code IntelliSense
- Reference Phaser types via `types.d.ts`
- Use type assertions for custom properties: `/** @type {CustomType} */ (object)`

### Phaser.js Best Practices
- Use `scene.add.container()` for grouped game objects
- Prefer `scene.physics.add.existing()` for physics bodies
- Use `scene.time.addEvent()` for timed animations
- Handle input through scene input events, not DOM events
- Use world coordinates for game logic, screen coordinates for UI

## Game-Specific Guidelines

### Physics & Gameplay
- Turrets can only aim in upper half-circle (-180° to 0°)
- Power ranges from 20% to 100% based on distance from turret
- Projectiles use realistic ballistic physics with gravity
- Collisions use terrain point interpolation for accuracy
- Explosions create debris that spreads outward with gravity

### Input Handling Priority
1. Multi-touch (2+ fingers) = camera panning
2. Single touch on turret = aiming mode
3. Single touch on landscape = camera dragging
4. Trackpad 2-finger gestures = camera panning
5. Keyboard WASD/arrows = camera movement

### UI/UX Patterns
- Smooth animations using Phaser's built-in tweens
- Responsive design that works on mobile and desktop

## Development Workflow

### Making Changes
1. Always maintain working game state
2. Test changes immediately in browser
3. Use browser dev tools for debugging
4. Commit frequently after successful changes
5. Follow the existing code patterns and naming conventions

### Error Handling
- Add console.log statements for debugging game events
- Use try-catch blocks for potentially failing operations
- Validate input parameters in functions
- Check for null/undefined before accessing properties

### Performance Considerations
- Reuse graphics objects when possible (e.g., tooltip containers)
- Clean up projectiles and effects when no longer needed
- Use object pooling for frequently created/destroyed objects
- Limit particle counts in explosion effects

## Common Patterns

### Creating Game Objects
```javascript
// Container-based approach for complex objects
const turret = scene.add.container(x, y);
const graphics = scene.add.graphics();
turret.add([graphics]);
```

### Physics Integration
```javascript
scene.physics.add.existing(gameObject);
gameObject.body.setVelocity(vx, vy);
gameObject.body.setCircle(radius);
```

### Animation and Timing
```javascript
scene.time.addEvent({
    delay: 16, // ~60fps
    repeat: 90,
    callback: () => { /* animation logic */ }
});
```

## Troubleshooting

### Common Issues
- **Canvas scrolling problems**: Use Phaser camera system, not CSS overflow
- **Touch input conflicts**: Check pointer tracking and event priority
- **Physics glitches**: Ensure proper world bounds and body setup
- **Performance drops**: Profile using browser dev tools

### Debugging Tips
- Use `console.log` for tracking game state changes
- Check browser network tab for asset loading issues
- Use Phaser's debug rendering for physics bodies
- Test on multiple devices for input compatibility

---

**Remember**: This is a Phaser.js game, so always prefer Phaser conventions over generic web development patterns. When in doubt, consult the Phaser.js documentation and maintain the existing code style.

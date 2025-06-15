# Rocket Wars

A browser-based artillery game where players fire rockets at each other's bases. Built with Phaser.js.

## Features

- **Multi-player support**: 2-4 players
- **Physics-based projectiles**: Realistic trajectory with wind effects
- **Dynamic landscape**: Destructible terrain
- **Mobile-friendly**: Touch controls and responsive camera
- **Camera following**: Automatic projectile tracking for better gameplay on small screens

## Getting Started

### Playing the Game

1. **Local Development**: Open `src/index.html` in your browser with a local server
2. **Live Version**: Visit the [GitHub Pages deployment](https://philgeorge.github.io/rocket-wars/)

### Game Controls

- **Desktop**: 
  - Click turrets to aim
  - Drag to move camera
  - Arrow keys or WASD for camera movement
- **Mobile**: 
  - Tap turrets to aim
  - Single finger drag for camera
  - Two-finger pan for camera movement

## Development

### Project Structure

```
rocket-wars/
├── index.html              # Main HTML file (GitHub Pages entry point)
├── src/
│   ├── main.js             # Game entry point and scene management
│   ├── landscape.js        # Terrain generation and rendering
│   ├── turret.js          # Turret logic and aiming system
│   ├── projectile.js      # Physics, trails, explosions
│   ├── ui.js              # Game state, status panel, wind system
│   ├── gameSetup.js       # Pre-game configuration form
│   ├── constants.js       # Game constants and calculations
│   └── style.css          # Game styling
├── update-version.js      # Cache-busting utility
└── README.md             # This file
```

### Deployment & Cache-Busting

The game is deployed to GitHub Pages using a `gh-pages` branch workflow. To handle GitHub Pages caching:

#### Updating Version Numbers

Before deploying changes, update cache-busting version numbers:

```bash
node update-version.js
```

This automatically updates the version parameters in `index.html`:
- `src/style.css?v=TIMESTAMP`
- `src/main.js?v=TIMESTAMP`

#### Deployment Workflow

1. **Make changes** on the `main` branch
2. **Update version numbers**:
   ```bash
   node update-version.js
   ```
3. **Commit and deploy**:
   ```bash
   git add .
   git commit -m "Add new features + version bump"
   git checkout gh-pages
   git merge main
   git push origin gh-pages
   ```

The live site will update within a few minutes without caching issues.

### Technical Notes

- **ES6 Modules**: Uses modern JavaScript module system
- **Phaser.js 3**: Game engine loaded via CDN
- **JSDoc**: Type annotations for better development experience
- **Pure Functions**: Preferred over classes where possible
- **Single Responsibility**: Each file handles one main game system

## Game Design

For detailed game mechanics and design principles, see `GameDesignDocument.md`.

## License

GPL-3.0 - See LICENSE file for details.

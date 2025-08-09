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

1. **Local Development**: Open `index.html` (root) in your browser with a local server
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

### Key Files / Folders

- [`index.html`](./index.html) – Entry point served by GitHub Pages / local server
- [`src/`](./src) – All game source (scenes, systems, UI, input, physics)
- [`docs/`](./docs) – General documentation (design, refactors, syntax notes)
- [`docs/features/`](./docs/features) – Feature design & implementation notes
- [`docs/GameDesignDocument.md`](./docs/GameDesignDocument.md) – Full game design document
- [`update-version.js`](./update-version.js) – Cache-busting utility for deployments

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

1. Make changes on the `main` branch
2. Update version numbers:
   ```bash
   node update-version.js
   ```
3. Commit and deploy:
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

Syntax checks:

- Single file: `npm run check-file -- path/to/file.js`
- All source files: `npm run check-files`

These commands run a Node parse (`node -c`) to catch syntax errors quickly.

## Game Design

For detailed game mechanics and design principles, see [`docs/GameDesignDocument.md`](./docs/GameDesignDocument.md).

## License

GPL-3.0 - See `LICENSE` file for details.

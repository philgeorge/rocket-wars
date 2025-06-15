# Cache-Busting Version Update Scripts

Two scripts are provided to automatically update cache-busting version numbers in `index.html`:

## Option 1: Node.js Script (Recommended - Cross-platform)

```bash
node update-version.js
```

**Requirements:** Node.js installed
**Works on:** Windows, macOS, Linux

## Option 2: Bash Script (Unix/macOS/WSL)

```bash
./update-version.sh
```

**Requirements:** Bash shell
**Works on:** macOS, Linux, WSL

## What the scripts do:

1. **Generate timestamp version**: Format `YYYYMMDD-HHMM` (e.g., `20250615-1913`)
2. **Update CSS link**: `src/style.css?v=NEW_VERSION`
3. **Update JS script**: `src/main.js?v=NEW_VERSION`
4. **Show confirmation**: Display updated version numbers

## Workflow:

1. Make changes to your game code
2. Run the version update script:
   ```bash
   node update-version.js
   ```
3. Commit and push to deploy:
   ```bash
   git add .
   git commit -m "Update game features + cache-busting version"
   git checkout gh-pages
   git merge main
   git push origin gh-pages
   ```

## Example output:

```
🔄 Updating cache-busting version to: 20250615-1913
✅ Updated version numbers in index.html
📝 CSS: src/style.css?v=20250615-1913
📝 JS:  src/main.js?v=20250615-1913

🚀 Ready to commit and deploy!
```

This ensures your GitHub Pages deployment will always serve the latest version without caching issues! 🎯

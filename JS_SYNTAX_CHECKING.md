# JavaScript ES Module Syntax Checking

This project uses ES modules (import/export statements) which can cause issues when testing with Node.js directly. Here are several ways to overcome the "Cannot use import statement outside a module" error:

## ✅ Solutions

### Option 1: Use the `--input-type=module` flag (Recommended)

```bash
# Check a single file
node --input-type=module -c < src/main.js

# Check a specific file (more explicit)
cat src/baseSelectionPanel.js | node --input-type=module -c
```

### Option 2: Use our custom shell script

```bash
# Make executable (one time only)
chmod +x check-js.sh

# Check any file
./check-js.sh src/main.js
./check-js.sh src/baseSelectionPanel.js
./check-js.sh src/ui/resultsPanel.js
```

### Option 3: Use npm scripts

```bash
# Check all JavaScript files in the project
npm run check-syntax
```

### Option 4: Project Configuration

The project's `package.json` now includes `"type": "module"` which tells Node.js that all `.js` files in this project should be treated as ES modules. However, this only works when running files from the project root, not from subdirectories.

## 🎯 Quick Examples

```bash
# Before (causes error)
node -c src/main.js
# ❌ SyntaxError: Cannot use import statement outside a module

# After (works!)
node --input-type=module -c < src/main.js
# ✅ No output = syntax is valid

# Or use our script
./check-js.sh src/main.js
# ✅ Syntax OK: src/main.js

# Check all files
npm run check-syntax
# ✅ Checks all .js files in src/ and src/**/
```

## 📝 Why This Happens

- ES modules (import/export) are the modern JavaScript standard
- Node.js defaults to CommonJS (require/module.exports) for `.js` files
- Browsers natively support ES modules, but Node.js needs explicit configuration
- The `--input-type=module` flag tells Node.js to treat the input as an ES module

## 🔧 Best Practices

1. **For quick syntax checks:** Use `./check-js.sh filename.js`
2. **For CI/automated testing:** Use `npm run check-syntax`
3. **For manual testing:** Use `node --input-type=module -c < filename.js`

This setup gives you multiple convenient ways to validate your JavaScript syntax without the ES module import errors!

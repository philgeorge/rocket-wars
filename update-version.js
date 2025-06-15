#!/usr/bin/env node

// update-version.js
// Cross-platform script to update cache-busting version numbers in index.html

const fs = require('fs');
const path = require('path');

// Generate timestamp-based version (YYYYMMDD-HHMM format)
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hour = String(now.getHours()).padStart(2, '0');
const minute = String(now.getMinutes()).padStart(2, '0');
const version = `${year}${month}${day}-${hour}${minute}`;

console.log(`🔄 Updating cache-busting version to: ${version}`);

const indexPath = 'index.html';

// Check if index.html exists
if (!fs.existsSync(indexPath)) {
    console.error('❌ Error: index.html not found in current directory');
    process.exit(1);
}

try {
    // Read the file
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Update CSS version (match src/style.css?v=anything)
    content = content.replace(
        /src\/style\.css\?v=[^"]*"/g, 
        `src/style.css?v=${version}"`
    );
    
    // Update JS version (match src/main.js?v=anything)
    content = content.replace(
        /src\/main\.js\?v=[^"]*"/g, 
        `src/main.js?v=${version}"`
    );
    
    // Write back to file
    fs.writeFileSync(indexPath, content, 'utf8');
    
    console.log('✅ Updated version numbers in index.html');
    console.log(`📝 CSS: src/style.css?v=${version}`);
    console.log(`📝 JS:  src/main.js?v=${version}`);
    console.log('');
    console.log('🚀 Ready to commit and deploy!');
    
} catch (error) {
    console.error('❌ Error updating file:', error.message);
    process.exit(1);
}

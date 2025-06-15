#!/bin/bash

# update-version.sh
# Script to automatically update cache-busting version numbers in index.html

# Generate timestamp-based version (YYYYMMDD-HHMM format)
VERSION=$(date +"%Y%m%d-%H%M")

echo "🔄 Updating cache-busting version to: $VERSION"

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found in current directory"
    exit 1
fi

# Update CSS version
sed -i.backup "s/src\/style\.css?v=[^\"]*\"/src\/style.css?v=$VERSION\"/g" index.html

# Update JS version  
sed -i.backup2 "s/src\/main\.js?v=[^\"]*\"/src\/main.js?v=$VERSION\"/g" index.html

# Remove backup files
rm -f index.html.backup index.html.backup2

echo "✅ Updated version numbers in index.html"
echo "📝 CSS: src/style.css?v=$VERSION"
echo "📝 JS:  src/main.js?v=$VERSION"
echo ""
echo "🚀 Ready to commit and deploy!"

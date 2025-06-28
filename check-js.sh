#!/bin/bash
# check-js.sh - Quick syntax checker for ES module JavaScript files

if [ $# -eq 0 ]; then
    echo "Usage: ./check-js.sh <file.js>"
    echo "   or: ./check-js.sh src/main.js"
    echo ""
    echo "This script checks JavaScript ES module syntax using Node.js"
    exit 1
fi

file="$1"

if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    exit 1
fi

echo "🔍 Checking syntax of: $file"
if node --input-type=module -c < "$file" 2>/dev/null; then
    echo "✅ Syntax OK: $file"
else
    echo "❌ Syntax Error in: $file"
    echo "Details:"
    node --input-type=module -c < "$file"
    exit 1
fi

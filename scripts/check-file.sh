#!/usr/bin/env bash
set -euo pipefail
# Syntax check JS files (CommonJS/ESM tolerant) via node -c
# Usage: npm run check-file -- [files...]
# If no files passed, all src/**/*.js are checked.

if [[ $# -eq 0 ]]; then
  FILES=()
  while IFS= read -r f; do
    FILES+=("$f")
  done < <(find src -type f -name '*.js' | sort)
else
  FILES=("$@")
fi

STATUS=0
for file in "${FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing file: $file" >&2
    STATUS=1
    continue
  fi
  echo "Checking $file..."
  if ! node --input-type=module -c < "$file" 2>/dev/null; then
    echo "Error in $file" >&2
    STATUS=1
  fi
done
exit $STATUS

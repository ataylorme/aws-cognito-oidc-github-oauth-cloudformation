#!/bin/sh

# Exit on error
set -e

directory="src/lambdas"

# Loop over the top-level directories
find "$directory" -maxdepth 1 -type d | while IFS= read -r dir; do
    if [ "$dir" = "$directory" ]; then
        continue
    fi
    # Extract the directory name from the path
    dir_name=$(basename "$dir")

    echo "$dir_name"
done | xargs -I {} -P 10 sh -c "npm run ncc -- build '$directory/{}/index.ts' --out 'dist/{}'" {}

exit 0

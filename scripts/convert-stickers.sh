#!/bin/bash
# Batch convert .ai stickers to optimized SVGs
# Created: 2025-12-12

INPUT_DIR="/Users/KevinHG/DevKev/personal/ynab-organizer/graphics"
OUTPUT_DIR="/Users/KevinHG/DevKev/personal/ynab-organizer/assets/stickers-all/converted"
PROJECT_DIR="/Users/KevinHG/DevKev/personal/ynab-organizer"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
total=0
converted=0
failed=0

echo "🎨 Starting sticker conversion..."
echo "Input: $INPUT_DIR"
echo "Output: $OUTPUT_DIR"
echo ""

# Find all .ai files
while IFS= read -r -d '' file; do
    ((total++))

    # Get parent folder name (e.g., "Main File 10")
    parent_folder=$(basename "$(dirname "$(dirname "$file")")")
    # Clean up folder name: "Main File 10" -> "mf10"
    folder_short=$(echo "$parent_folder" | sed 's/Main File /mf/g' | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

    # Get filename without extension and clean it
    filename=$(basename "$file" .ai)
    # Remove leading numbers and dots, clean up
    clean_name=$(echo "$filename" | sed 's/^[0-9]*\. //' | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr '_' '-')

    # Final output name
    output_name="${folder_short}_${clean_name}.svg"
    output_path="$OUTPUT_DIR/$output_name"

    echo -n "[$total] Converting: $output_name... "

    # Convert with Inkscape
    if /Applications/Inkscape.app/Contents/MacOS/inkscape "$file" --export-type=svg --export-filename="$output_path" 2>/dev/null; then
        # Optimize with SVGO
        if npx svgo "$output_path" --output "$output_path" -q --project-dir="$PROJECT_DIR" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
            ((converted++))
        else
            echo -e "${YELLOW}✓ (no optimize)${NC}"
            ((converted++))
        fi
    else
        echo "✗ FAILED"
        ((failed++))
    fi

done < <(find "$INPUT_DIR" -name "*.ai" -print0)

echo ""
echo "================================"
echo "🎬 Conversion complete!"
echo "Total files: $total"
echo "Converted: $converted"
echo "Failed: $failed"
echo "================================"

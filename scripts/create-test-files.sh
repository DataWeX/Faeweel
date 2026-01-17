#!/bin/bash

# Creates test files for Faeweel demonstration

echo "Creating test files..."

TARGET_DIR="${1:-./test-files}"

mkdir -p "$TARGET_DIR"

# Create various file types
for i in {1..10}; do
    echo "Test file $i - Created at $(date)" > "$TARGET_DIR/file_$i.txt"
done

# Create a subdirectory with files
mkdir -p "$TARGET_DIR/subfolder"
for i in {1..5}; do
    echo "Subfolder test file $i - Created at $(date)" > "$TARGET_DIR/subfolder/subfile_$i.txt"
done

# Create a JSON file
cat > "$TARGET_DIR/data.json" << EOF
{
  "test": true,
  "files": 10,
  "timestamp": "$(date -Iseconds)",
  "description": "Sample JSON file for Faeweel testing"
}
EOF

# Create a markdown file
cat > "$TARGET_DIR/notes.md" << EOF
# Test Notes

This is a test markdown file created at $(date)

## Purpose

This file is used to test Faeweel's file transfer capabilities.

## Features Tested

- Text file transfer
- Directory structure preservation
- Real-time monitoring
- Queue processing
EOF

echo "✓ Created test files in $TARGET_DIR"
echo "  - 10 text files"
echo "  - 1 subdirectory with 5 files"
echo "  - 1 JSON file"
echo "  - 1 Markdown file"
echo ""
echo "Total: 17 files ready for transfer testing"

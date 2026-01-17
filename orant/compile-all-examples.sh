#!/bin/bash

# Compile All Examples Script
# Compiles all .lang files in the examples/ directory

set -e  # Exit on error

echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "📝 Compiling all example programs..."
echo ""

success_count=0
total_count=0

for file in examples/*.lang; do
  total_count=$((total_count + 1))
  filename=$(basename "$file")

  echo "[$total_count] Compiling $filename..."

  if node dist/compiler.js "$file"; then
    success_count=$((success_count + 1))
  else
    echo "❌ Failed to compile $filename"
    exit 1
  fi

  echo ""
done

echo "✅ Successfully compiled $success_count/$total_count programs!"
echo ""
echo "Generated files in: orant/output/generated/"
echo "View animations in: viewer.html"

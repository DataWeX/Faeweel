#!/bin/bash

# Development script for Faeweel
# Runs the application with developer tools enabled

echo "🔄 Starting Faeweel in Development Mode..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Running setup..."
    npm install
    echo ""
fi

# Start the application
echo "Launching application with DevTools..."
npm run dev

#!/bin/bash

# Faeweel Setup Script
# This script sets up the development environment for Faeweel

set -e

echo "🔄 Faeweel Setup Script"
echo "======================="
echo ""

# Check Node.js installation
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION detected"

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✓ npm $NPM_VERSION detected"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "Creating example directories..."

# Create example directories for testing
mkdir -p examples/source
mkdir -p examples/destination
mkdir -p examples/test-files

# Create some example files
cat > examples/test-files/sample1.txt << EOF
This is a sample file for testing Faeweel.
It will be transferred when you start monitoring.
EOF

cat > examples/test-files/sample2.txt << EOF
Another sample file for testing.
Faeweel will detect and transfer this automatically.
EOF

cat > examples/test-files/readme.txt << EOF
These are example files for testing Faeweel.
Copy these files to the 'source' folder to test transfers.
EOF

echo "✓ Example directories created"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run the app in development mode:"
echo "     npm run dev"
echo ""
echo "  2. Or run in production mode:"
echo "     npm start"
echo ""
echo "  3. For testing, copy files from examples/test-files to examples/source"
echo "     and set examples/destination as the destination folder"
echo ""
echo "Happy transferring! 🚀"

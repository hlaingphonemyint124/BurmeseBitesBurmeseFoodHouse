#!/bin/bash

# ═══════════════════════════════════════════════════════════
#  BurmeseBites — Fix blank screen & start dev server
#  Usage: drag this file into Terminal and press Enter
# ═══════════════════════════════════════════════════════════

set -e

# Find the project folder (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo ""
echo "📁 Project folder: $SCRIPT_DIR"
echo ""

# Kill any running Vite on port 5173
echo "⏹  Stopping any running dev server..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Go to project
cd "$SCRIPT_DIR"

# Wipe Vite cache
echo "🗑  Clearing Vite cache..."
rm -rf node_modules/.vite

# Wipe and reinstall node_modules if react plugin missing
if [ ! -d "node_modules/@vitejs/plugin-react" ]; then
  echo "📦 @vitejs/plugin-react missing — reinstalling node_modules..."
  rm -rf node_modules package-lock.json
  npm install
else
  echo "✅ node_modules look OK"
fi

# Start
echo ""
echo "🚀 Starting dev server..."
echo ""
npm run dev

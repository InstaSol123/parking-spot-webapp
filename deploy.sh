#!/bin/bash

# Parking Spot - Production Deployment Script
# This script deploys the built frontend to the production server

set -e  # Exit on any error

echo "========================================="
echo "  Parking Spot - Production Deployment  "
echo "========================================="
echo ""

# Configuration
SOURCE_DIR="/home/owner/parking spot/dist"
TARGET_DIR="/var/www/qr.mytesting.cloud/build"
BACKUP_DIR="/var/www/qr.mytesting.cloud/build_backup_$(date +%Y%m%d_%H%M%S)"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Source directory not found: $SOURCE_DIR"
    echo "Please run 'npm run build' first!"
    exit 1
fi

# Check if we have files to deploy
if [ -z "$(ls -A "$SOURCE_DIR")" ]; then
    echo "❌ Error: Source directory is empty: $SOURCE_DIR"
    echo "Please run 'npm run build' first!"
    exit 1
fi

echo "📦 Source: $SOURCE_DIR"
echo "🎯 Target: $TARGET_DIR"
echo ""

# Create backup of current deployment
if [ -d "$TARGET_DIR" ]; then
    echo "💾 Creating backup..."
    sudo cp -r "$TARGET_DIR" "$BACKUP_DIR"
    echo "✅ Backup created: $BACKUP_DIR"
    echo ""
fi

# Deploy new build
echo "🚀 Deploying new build..."
sudo rm -rf "$TARGET_DIR"/*
sudo cp -r "$SOURCE_DIR"/* "$TARGET_DIR"/

# Set correct permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data "$TARGET_DIR"
sudo chmod -R 755 "$TARGET_DIR"

# Verify deployment
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Deployed files:"
ls -lh "$TARGET_DIR/assets/" | tail -5

echo ""
echo "🌐 Your site is now live at: https://qr.mytesting.cloud"
echo ""
echo "🧪 Testing steps:"
echo "  1. Clear browser cache (Ctrl+Shift+Delete)"
echo "  2. Visit https://qr.mytesting.cloud"
echo "  3. Login with admin@admin.com / admin"
echo "  4. Check dashboard shows 2,000,000 permissions"
echo ""

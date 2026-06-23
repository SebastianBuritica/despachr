#!/bin/bash

# Despachr Deployment Script
# Builds and deploys the project to Vercel

set -e

echo "🚀 Despachr Deployment Script"
echo "=============================="

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: Working directory has uncommitted changes"
    echo "Please commit or stash your changes before deploying"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel deploy --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "🔗 App: https://despachr.vercel.app"
    echo ""
else
    echo "❌ Deployment failed"
    exit 1
fi

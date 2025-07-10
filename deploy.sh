#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start new containers
echo "🔨 Building and starting new containers..."
docker-compose up -d --build

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker system prune -f

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be running on http://localhost:3000" 
#!/bin/bash

# Production container startup helper script
echo "=== Starting LiveQuiz Docker Container Deployment ==="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker daemon is not running. Please start Docker first."
    exit 1
fi

echo "Building and starting container services..."
docker compose up --build -d

echo "Services started successfully!"
echo "- Frontend client: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- MongoDB server: http://localhost:27017"
echo "- Redis cache: http://localhost:6379"
echo "============================================="

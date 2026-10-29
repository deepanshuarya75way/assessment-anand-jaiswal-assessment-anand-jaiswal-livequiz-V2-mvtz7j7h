# Windows PowerShell startup helper script
Write-Host "=== Starting LiveQuiz Docker Container Deployment ===" -ForegroundColor Cyan

# Check if Docker is running
& docker info >$null 2>&1
if ($LastExitCode -ne 0) {
    Write-Error "Docker daemon is not running. Please start Docker Desktop first."
    Exit
}

Write-Host "Building and starting container services..." -ForegroundColor Yellow
& docker compose up --build -d

Write-Host "`nServices started successfully!" -ForegroundColor Green
Write-Host "- Frontend client: http://localhost:3000"
Write-Host "- Backend API: http://localhost:8000"
Write-Host "- MongoDB server: http://localhost:27017"
Write-Host "- Redis cache: http://localhost:6379"
Write-Host "=============================================" -ForegroundColor Cyan

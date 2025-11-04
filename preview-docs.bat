@echo off
echo.
echo ========================================
echo   TGraph Documentation Preview
echo ========================================
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running or not installed!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.
echo Checking docs directory...

if not exist "docs" (
    echo ERROR: docs directory not found!
    echo Please run this script from the project root.
    pause
    exit /b 1
)

echo [OK] docs directory found
echo.
echo Starting Jekyll server...
echo Server will be at: http://localhost:4000/
echo Press Ctrl+C to stop
echo.
echo Installing dependencies (first run takes ~1 minute)...
echo.

cd docs

echo Pulling latest Jekyll image...
docker pull jekyll/jekyll:4.2.2

echo.
echo Starting server (this may take a minute on first run)...
docker run --rm -it ^
  -p 4000:4000 ^
  -v "%cd%":/srv/jekyll ^
  -e JEKYLL_ENV=development ^
  jekyll/jekyll:4.2.2 ^
  jekyll serve --host 0.0.0.0 --force_polling --livereload --verbose


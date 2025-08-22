# Windows Setup Guide

> **Related**: [Quick Start](quick-start.md) | [Database Setup](database-setup.md) | [Common Issues](../troubleshooting/common-issues.md)

Complete setup guide for running Party Collection on Windows 10/11 with PowerShell, Command Prompt, and Windows Subsystem for Linux (WSL).

## 🎯 Choose Your Windows Setup Path

### Option 1: Native Windows (Recommended for beginners)
- Use PowerShell and Windows Docker Desktop
- All tools run natively on Windows
- Good performance, familiar environment

### Option 2: WSL2 (Recommended for advanced users)
- Linux environment within Windows
- Better Docker performance
- More Unix-like development experience

### Option 3: Hybrid Approach
- Docker Desktop on Windows
- Node.js development in WSL2
- Best of both worlds

---

## 💻 Native Windows Setup

### Prerequisites Installation

**1. Install Node.js**
```powershell
# Download from https://nodejs.org (LTS version recommended)
# Or use Chocolatey package manager
choco install nodejs

# Verify installation
node --version
npm --version
```

**2. Install Git for Windows**
```powershell
# Download from https://git-scm.com/download/win
# Or use Chocolatey
choco install git

# Verify installation
git --version
```

**3. Install Docker Desktop**
```powershell
# Download from https://www.docker.com/products/docker-desktop
# Requires Windows 10/11 Pro, Enterprise, or Education
# Or Windows 10/11 Home with WSL2 backend
```

**4. Install Visual Studio Code (Optional)**
```powershell
# Download from https://code.visualstudio.com/
# Or use Chocolatey
choco install vscode
```

### Environment Setup

**Clone the Repository**
```cmd
# Open Command Prompt or PowerShell as Administrator
cd C:\
mkdir Development
cd Development

# Clone repository
git clone https://github.com/YOUR_USERNAME/yourpartycollection.git
cd yourpartycollection
```

**Set PowerShell Execution Policy**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verify change
Get-ExecutionPolicy
```

**Configure Git Line Endings**
```cmd
# Configure Git to handle Windows line endings
git config --global core.autocrlf true
git config --global core.eol crlf
```

### Running the Application

**Start Local Environment**
```cmd
# Navigate to project directory
cd C:\Development\yourpartycollection

# Make sure Docker Desktop is running
# Check if Docker is available
docker --version

# Start the application
cd infra\local\scripts

# For Command Prompt
start-local.bat

# For PowerShell
.\start-local.ps1
```

**Windows Start Script (start-local.bat)**
```batch
@echo off
echo Starting Party Collection local environment on Windows...

echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running or not installed.
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Starting PostgreSQL and PgAdmin...
cd ..\docker
docker-compose up -d

echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo Starting backend...
cd ..\..\backend
start cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend...
cd ..\frontend
start cmd /k "npm run dev"

echo.
echo ✅ Party Collection is starting up!
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001/health
echo PgAdmin:  http://localhost:8080
echo.
echo Press any key to continue...
pause >nul
```

**PowerShell Start Script (start-local.ps1)**
```powershell
Write-Host "Starting Party Collection local environment on Windows..." -ForegroundColor Green

# Check if Docker is running
try {
    docker --version | Out-Null
} catch {
    Write-Host "Error: Docker is not running or not installed." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting PostgreSQL and PgAdmin..." -ForegroundColor Blue
Set-Location "..\docker"
docker-compose up -d

Write-Host "Waiting for database to be ready..." -ForegroundColor Blue
Start-Sleep -Seconds 10

Write-Host "Starting backend..." -ForegroundColor Blue
Set-Location "..\..\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Start-Sleep -Seconds 5

Write-Host "Starting frontend..." -ForegroundColor Blue
Set-Location "..\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "✅ Party Collection is starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3001/health" -ForegroundColor Cyan
Write-Host "PgAdmin:  http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
```

**Stop Script (stop-local.bat)**
```batch
@echo off
echo Stopping Party Collection local environment...

echo Stopping Docker containers...
cd ..\docker
docker-compose down

echo Stopping Node.js processes...
taskkill /f /im node.exe 2>nul

echo ✅ Environment stopped successfully!
pause
```

### Windows-Specific Configuration

**Environment Variables**
```cmd
# Create .env files with Windows paths
cd backend
copy .env.example .env

# Edit .env file - use Windows paths if needed
# DB_HOST=localhost (should work fine)
# No changes needed for basic setup
```

**File Permissions**
```cmd
# Windows doesn't have the same permission system as Unix
# Scripts should work without chmod
# If you get permission errors, run as Administrator
```

**Port Configuration**
```cmd
# Check if ports are available
netstat -an | findstr :3000
netstat -an | findstr :3001
netstat -an | findstr :5432

# If ports are in use, kill processes
# Use Task Manager or:
for /f "tokens=5" %a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %a
```

---

## 🐧 WSL2 Setup (Advanced)

### Install WSL2

**Enable WSL2**
```powershell
# Run PowerShell as Administrator

# Enable WSL feature
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart Windows

# Set WSL2 as default
wsl --set-default-version 2

# Install Ubuntu
wsl --install -d Ubuntu
```

**Setup Ubuntu Environment**
```bash
# Inside WSL2 Ubuntu terminal

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git

# Verify installations
node --version
npm --version
git --version
```

**Configure Docker for WSL2**
1. Install Docker Desktop on Windows
2. Go to Docker Desktop Settings
3. Check "Use the WSL 2 based engine"
4. Enable integration with Ubuntu distro

**Clone and Run in WSL2**
```bash
# In WSL2 terminal
cd ~
git clone https://github.com/YOUR_USERNAME/yourpartycollection.git
cd yourpartycollection

# Follow standard Linux setup
cd infra/local/scripts
chmod +x *.sh
./start-local.sh
```

---

## 🛠️ Windows-Specific Troubleshooting

### Common Issues

**Docker Desktop Issues**
```powershell
# Docker Desktop not starting
# Solution 1: Check Windows features
# Control Panel > Programs > Turn Windows features on/off
# Ensure "Hyper-V" and "Containers" are enabled

# Solution 2: Reset Docker Desktop
# Right-click Docker Desktop > Troubleshoot > Reset to factory defaults

# Solution 3: Check WSL2 integration
# Docker Desktop Settings > Resources > WSL Integration
```

**Node.js Issues**
```cmd
# Node modules permission issues
# Solution: Run as Administrator or change npm directory
npm config set prefix "C:\Users\%USERNAME%\AppData\Roaming\npm"

# Module not found errors
# Delete node_modules and reinstall
rmdir /s node_modules
del package-lock.json
npm install
```

**Port Already in Use**
```cmd
# Find process using port
netstat -ano | findstr :3000

# Kill process by PID
taskkill /f /pid <PID>

# Or kill all Node processes
taskkill /f /im node.exe
```

**PowerShell Script Execution**
```powershell
# If scripts won't run
Get-ExecutionPolicy

# If Restricted, change to RemoteSigned
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# For single script
PowerShell.exe -ExecutionPolicy Bypass -File .\start-local.ps1
```

**Line Ending Issues**
```cmd
# If bash scripts have Windows line endings in WSL
# Convert line endings
dos2unix infra/local/scripts/*.sh

# Or configure Git properly
git config --global core.autocrlf input
```

### Windows Performance Optimization

**Docker Performance**
```powershell
# Allocate more resources to Docker Desktop
# Docker Desktop Settings > Resources
# Memory: 4GB minimum, 8GB recommended
# CPU: 2 cores minimum
```

**File System Performance**
```cmd
# Use SSD for development if possible
# Place project on C: drive for best performance
# Avoid network drives or cloud-synced folders
```

**Antivirus Exclusions**
```
Add exclusions to Windows Defender/antivirus:
- C:\Development\yourpartycollection
- Docker Desktop installation directory
- Node.js installation directory
- npm cache directory (%APPDATA%\npm-cache)
```

---

## 📦 Windows Package Managers

### Chocolatey Setup
```powershell
# Install Chocolatey (run as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install development tools
choco install nodejs git docker-desktop vscode
```

### Windows Package Manager (winget)
```cmd
# Install using Windows Package Manager (Windows 10 1809+)
winget install OpenJS.NodeJS
winget install Git.Git
winget install Docker.DockerDesktop
winget install Microsoft.VisualStudioCode
```

### Scoop (Alternative)
```powershell
# Install Scoop
iwr -useb get.scoop.sh | iex

# Install development tools
scoop install nodejs git
```

---

## 🔧 IDE Configuration for Windows

### Visual Studio Code
```json
// .vscode/settings.json (Windows-specific)
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "icon": "terminal-powershell"
    },
    "Command Prompt": {
      "path": "cmd.exe",
      "icon": "terminal-cmd"
    },
    "WSL": {
      "path": "wsl.exe",
      "icon": "terminal-ubuntu"
    }
  },
  "eslint.workingDirectories": ["backend", "frontend"],
  "npm.packageManager": "npm"
}
```

### Recommended Extensions
```
- ESLint
- Prettier
- Docker
- WSL (if using WSL2)
- PowerShell (if using PowerShell)
- GitLens
```

---

## 🧪 Testing on Windows

### Running Tests
```cmd
# Command Prompt
cd C:\Development\yourpartycollection
node test-runner.js --env=local

# PowerShell
Set-Location "C:\Development\yourpartycollection"
node test-runner.js --env=local

# WSL2
cd ~/yourpartycollection
node test-runner.js --env=local
```

### Windows Test Script
```batch
@echo off
echo Running Party Collection tests on Windows...

echo Checking if environment is running...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Environment not running. Starting it now...
    cd infra\local\scripts
    call start-local.bat
    timeout /t 30 /nobreak >nul
)

echo Running backend tests...
cd backend
npm test

echo Running frontend tests...
cd ..\frontend
set HEADLESS=true && set PARALLEL=false && set TAGS=@fast && npm test

echo ✅ All tests completed!
pause
```

---

## 🌐 Windows Firewall & Networking

### Firewall Configuration
```cmd
# Allow Node.js through firewall (run as Administrator)
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="C:\Program Files\nodejs\node.exe"

# Allow specific ports
netsh advfirewall firewall add rule name="Party Collection Backend" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="Party Collection Frontend" dir=in action=allow protocol=TCP localport=3000
```

### Accessing from Other Devices
```cmd
# Find your Windows IP address
ipconfig | findstr IPv4

# Access from mobile/other devices on same network
# http://YOUR_WINDOWS_IP:3000
```

---

## 📋 Windows Setup Checklist

### Pre-Installation
- [ ] Windows 10/11 (version 1809 or later)
- [ ] 8GB RAM minimum (16GB recommended)
- [ ] 50GB free disk space
- [ ] Administrator access
- [ ] Internet connection

### Installation Steps
- [ ] Install Node.js (LTS version)
- [ ] Install Git for Windows
- [ ] Install Docker Desktop
- [ ] Configure PowerShell execution policy
- [ ] Clone repository
- [ ] Run start-local script
- [ ] Verify all services running
- [ ] Run test suite

### Optional Enhancements
- [ ] Install VS Code with extensions
- [ ] Set up WSL2 for better development experience
- [ ] Configure Windows Terminal
- [ ] Set up package manager (Chocolatey/winget)
- [ ] Configure antivirus exclusions

---

## 🆘 Getting Help

### Windows-Specific Resources
- **[Windows Docker Documentation](https://docs.docker.com/desktop/windows/)**
- **[Node.js Windows Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)**
- **[WSL2 Documentation](https://docs.microsoft.com/en-us/windows/wsl/)**

### Common Commands Reference
```cmd
# Check running processes
tasklist | findstr node

# Kill all Node processes
taskkill /f /im node.exe

# Check open ports
netstat -an | findstr LISTENING

# Restart Docker Desktop
net stop com.docker.service
net start com.docker.service
```

### Community Support
- **[GitHub Issues](https://github.com/YOUR_USERNAME/yourpartycollection/issues)** - Report Windows-specific issues
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/windows+node.js)** - General Windows development help

---

**🎯 Windows Tip**: Windows development can be just as powerful as macOS/Linux! Use the right tools and configuration for your workflow preference.
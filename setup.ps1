# Anon Browser Setup Script for Windows
# This script checks for Node.js, Git, and Windows Build Tools
# If missing, it will attempt to install them automatically.

function Check-Command {
    param([string]$cmd)
    try {
        & $cmd --version > $null 2>&1
        return $true
    } catch {
        return $false
    }
}

Write-Host "Checking system requirements for Anon Browser..."

# Check Node.js
if (-not (Check-Command "node")) {
    Write-Host "Node.js not found. Installing Node.js LTS..."
    Invoke-WebRequest -Uri https://nodejs.org/dist/v20.6.1/node-v20.6.1-x64.msi -OutFile "$env:TEMP\node-lts.msi"
    Start-Process msiexec.exe -Wait -ArgumentList "/i $env:TEMP\node-lts.msi /quiet /norestart"
} else {
    Write-Host "Node.js is installed."
}

# Check npm
if (-not (Check-Command "npm")) {
    Write-Host "npm not found. It should be installed with Node.js. Please reinstall Node.js."
}

# Check Git
if (-not (Check-Command "git")) {
    Write-Host "Git not found. Installing Git..."
    Invoke-WebRequest -Uri https://github.com/git-for-windows/git/releases/download/v2.41.0.windows.1/Git-2.41.0-64-bit.exe -OutFile "$env:TEMP\git-installer.exe"
    Start-Process "$env:TEMP\git-installer.exe" -Wait -ArgumentList "/VERYSILENT /NORESTART"
} else {
    Write-Host "Git is installed."
}

# Check Windows Build Tools
if (-not (Check-Command "node-gyp")) {
    Write-Host "Installing Windows Build Tools for native modules..."
    npm install --global windows-build-tools
} else {
    Write-Host "Windows Build Tools already installed."
}

Write-Host "All required dependencies are installed. You can now run 'npm install' and 'npm start'."

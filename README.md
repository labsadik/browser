
````markdown
# Anon Browser

**Anon Browser** is a lightweight, privacy-focused web browser built using **Electron**. It supports multiple tabs, bookmarks, history, downloads management, SSL certificate inspection, and developer tools integration, making it ideal for secure browsing with a simple and intuitive interface.

---

## Features

### 1. Multi-Tab Browsing
* Open multiple tabs simultaneously.
* Switch between tabs easily.
* Close and manage tabs dynamically.
* Each tab displays its page title and favicon.

### 2. URL Bar
* Enter URLs or search queries directly.
* Automatically prepends `https://` if the protocol is missing.
* Falls back to Google search if input is ambiguous.
* Displays a lock icon for HTTPS and a warning for insecure sites.

### 3. Bookmarks
* Add bookmarks for quick access.
* View and manage bookmarks via a popup menu.
* Clear all bookmarks with a single click.
* Bookmarks include URL, title, and timestamp.

### 4. History
* Tracks visited pages per session.
* View history in a dedicated panel.
* Open pages from history in new tabs.
* Clear history when needed.

### 5. Downloads
* Shows a panel listing all downloaded files.
* View file names and paths.
* Clear all downloads from the panel.
* Downloads list is updated in real-time.

### 6. SSL Certificate Inspection
* Click the lock icon to view SSL certificate details.
* Shows certificate issuer, validity period, and fingerprint.
* Helps verify secure connections.

### 7. Developer Tools
* Global DevTools toggle via toolbar button.
* Open per-tab DevTools using `F12`.
* Inspect and debug pages easily.

### 8. Window Controls
* Minimize, maximize, and close the browser window.
* Fully integrated with Electron APIs.

### 9. Error Handling
* Displays an error screen when a page fails to load.
* Allows retrying failed requests.

---

## Technologies Used
* **Electron**: For creating the desktop application.
* **JavaScript/HTML/CSS**: Core UI and functionality.
* **Electron APIs**: For bookmarks, downloads, history, window controls, and certificate fetching.
* **Webview**: Embedded browser component for each tab.

---

## Prerequisites (Windows)

Before running **Anon Browser**, ensure the following software is installed:

* **Node.js (LTS version)**
* **Git**
* **Visual Studio Code (optional but recommended)**
* **Windows Build Tools (optional but recommended)**

---

## Auto-Setup Script (Windows)

We include a **setup script** that will automatically check and install missing dependencies.  
> **Note:** Run this in **PowerShell as Administrator**.

Create a file named `setup.ps1` in your project root with the following content:

```powershell
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
````

### How to Use

1. Open **PowerShell as Administrator**.
2. Navigate to your project folder:

```powershell
cd C:\path\to\Anon-Browser
```

3. Run the setup script:

```powershell
.\setup.ps1
```

The script will check each requirement and install missing components automatically.

---

## Installation

Once prerequisites are installed:

1. Clone the repository:

```bash
git clone <repository_url>
```

2. Navigate to the project folder:

```bash
cd browser
```

3. Install dependencies:

```bash
npm install
```

4. Start the application:

```bash
npm start
```

---

## Usage

* **Open a new tab:** Click the "+" button in the toolbar.
* **Navigate to a URL:** Type in the address bar and press Enter.
* **Bookmark a page:** Click the star button and select "Add Bookmark."
* **View history:** Click the history icon to see visited pages.
* **Manage downloads:** Click the downloads icon to see downloaded files.
* **Check SSL certificate:** Click the lock icon in the URL bar.
* **Developer tools:** Press `F12` or use the DevTools button.

---

## File Structure

```
browser/
├─ main.js           # Electron main process
├─ renderer.js       # Browser UI and tab management
├─ preload.js        # Preload script for webview
├─ index.html        # Main HTML UI
├─ styles.css        # Styles for the browser
├─ icons/            # Browser icons (favicons, toolbar icons)
├─ setup.ps1         # Windows setup script for dependencies
└─ package.json      # Project metadata and dependencies
```

---

## Development Notes

* You can run the app directly from VS Code using the integrated terminal.
* Use **Electron Debug** and **DevTools** for inspecting and debugging pages.
* For production builds, use **electron-packager** or **electron-builder**.

Example of packaging the app:

```bash
npm install --save-dev electron-packager
npx electron-packager . AnonBrowser --platform=win32 --arch=x64
```

---

## Contribution

Contributions are welcome! You can:

* Add features like ad-blocking or extensions.
* Improve UI/UX.
* Optimize memory usage for multiple tabs.
* Fix bugs and improve stability.

---
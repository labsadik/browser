// ----------------------
// GLOBAL TAB STATE
// ----------------------
let tabs = [];
let activeTab = null;

// ----------------------
// UI REFERENCES
// ----------------------
const tabContainer = document.getElementById("tabs");
const viewContainer = document.getElementById("view-container");

const urlInput = document.getElementById("url-input");
const urlFavicon = document.getElementById("url-favicon");
const lockIcon = document.getElementById("lock-icon");

// Error screen
const errorScreen = document.getElementById("error-screen");
const errorDesc = document.getElementById("error-desc");
const retryBtn = document.getElementById("retry-btn");

// Downloads
const downloadsBtn = document.getElementById("downloads-btn");
const downloadsPanel = document.getElementById("downloads-panel");
const downloadsList = document.getElementById("downloads-list");
const closeDownloads = document.getElementById("close-downloads");
const clearDownloads = document.getElementById("clear-downloads");

// History
const historyBtn = document.getElementById("history-btn");
const historyPanel = document.getElementById("history-panel");
const historyList = document.getElementById("history-list");
const closeHistory = document.getElementById("close-history");
const clearHistory = document.getElementById("clear-history");

// Bookmarks popup (below ★)
const bookmarkBtn = document.getElementById("bookmark-btn");
const bookmarkPopup = document.getElementById("bookmark-popup");
const bookmarkList = document.getElementById("bookmark-list");
const closeBookmarkPopup = document.getElementById("close-bookmark-popup");
const clearBookmarksBtn = document.getElementById("clear-bookmarks");
const addBookmarkBtn = document.getElementById("add-bookmark");

// SSL popover
const certPopover = document.getElementById("cert-popover");
const certStatus = document.getElementById("cert-status");
const certInfo = document.getElementById("cert-info");
const closeCert = document.getElementById("close-cert");

// DevTools
const devtoolsBtn = document.getElementById("devtools-btn");

// Window controls
document.getElementById("min-btn").onclick = () => window.electronAPI.minimize();
document.getElementById("max-btn").onclick = () => window.electronAPI.maximize();
document.getElementById("close-btn").onclick = () => window.electronAPI.close();

// Toolbar actions
document.getElementById("new-tab-btn").onclick = () => newTab("https://www.google.com/");
document.getElementById("back-btn").onclick = () => activeTab?.webview.goBack();
document.getElementById("forward-btn").onclick = () => activeTab?.webview.goForward();
document.getElementById("reload-btn").onclick = () => activeTab?.webview.reload();


// ========================================================
// BOOKMARK POPUP (FLOATING UNDER ★)
// ========================================================
bookmarkBtn.addEventListener("click", async () => {
    bookmarkPopup.classList.toggle("hidden");

    if (!bookmarkPopup.classList.contains("hidden")) {
        await loadBookmarks();
    }
});

closeBookmarkPopup.addEventListener("click", () => bookmarkPopup.classList.add("hidden"));

clearBookmarksBtn.onclick = async () => {
    await window.electronAPI.clearBookmarks();
    await loadBookmarks();
};

addBookmarkBtn.onclick = async () => {
    if (!activeTab) return;

    const url = activeTab.webview.getURL();
    const title = activeTab.titleEl?.textContent || url;

    await window.electronAPI.saveBookmark({
        url,
        title,
        time: new Date().toISOString()
    });

    await loadBookmarks();
};


// ========================================================
// DOWNLOAD PANEL
// ========================================================
downloadsBtn.onclick = toggleDownloadsPanel;
closeDownloads.onclick = () => downloadsPanel.classList.add("hidden");

clearDownloads.onclick = async () => {
    await window.electronAPI.clearDownloads();
    await loadDownloads();
};

async function toggleDownloadsPanel() {
    downloadsPanel.classList.toggle("hidden");

    if (!downloadsPanel.classList.contains("hidden")) {
        await loadDownloads();
    }
}

async function loadDownloads() {
    downloadsList.innerHTML = "Loading…";

    const res = await window.electronAPI.getDownloads();
    if (!res.ok) {
        downloadsList.innerHTML = "Error loading downloads";
        return;
    }

    const list = res.list || [];
    downloadsList.innerHTML = "";

    if (!list.length) {
        downloadsList.innerHTML = "<div>No downloads</div>";
        return;
    }

    list.reverse().forEach(d => {
        const item = document.createElement("div");
        item.className = "download-item";
        item.innerHTML = `
            <div>
                <b>${d.filename}</b>
                <div style="color:#aaa">${d.path}</div>
            </div>
        `;
        downloadsList.appendChild(item);
    });
}


// ========================================================
// HISTORY PANEL
// ========================================================
historyBtn.onclick = toggleHistoryPanel;
closeHistory.onclick = () => historyPanel.classList.add("hidden");

clearHistory.onclick = async () => {
    await window.electronAPI.clearHistory();
    await loadHistory();
};

async function toggleHistoryPanel() {
    historyPanel.classList.toggle("hidden");
    if (!historyPanel.classList.contains("hidden")) await loadHistory();
}

async function loadHistory() {
    historyList.innerHTML = "Loading…";

    const res = await window.electronAPI.getHistory();
    if (!res.ok) {
        historyList.innerHTML = "Error loading history";
        return;
    }

    const list = res.list || [];
    historyList.innerHTML = "";

    if (!list.length) {
        historyList.innerHTML = "<div>No history found</div>";
        return;
    }

    list.reverse().forEach(item => {
        const el = document.createElement("div");
        el.className = "history-item";
        el.innerHTML = `
            <div><b>${item.title || item.url}</b></div>
            <div style="color:#aaa">${item.url}</div>
        `;
        el.onclick = () => {
            historyPanel.classList.add("hidden");
            newTab(item.url);
        };
        historyList.appendChild(el);
    });
}


// ========================================================
// SSL CERTIFICATE POPOVER
// ========================================================
lockIcon.onclick = async () => {
    if (!activeTab) return;

    const url = activeTab.webview.getURL();

    certPopover.classList.toggle("hidden");

    if (certPopover.classList.contains("hidden")) return;

    certStatus.textContent = "Loading…";
    certInfo.textContent = "";

    const res = await window.electronAPI.getCertificate(url);

    if (!res.ok) {
        certStatus.textContent = "Error fetching certificate";
        return;
    }

    const cert = res.cert;
    certStatus.textContent = cert.subject?.CN || "Valid certificate";

    certInfo.textContent = `
Issuer: ${JSON.stringify(cert.issuer, null, 2)}

Valid:
  From: ${cert.valid_from}
  To:   ${cert.valid_to}

Fingerprint:
  ${cert.fingerprint}
  `;
};

closeCert.onclick = () => certPopover.classList.add("hidden");


// ========================================================
// URL BAR
// ========================================================
urlInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    loadURL(urlInput.value);
});

function normalizeURL(v) {
    if (!v) return "";
    v = v.trim();

    if (v.startsWith("http://") || v.startsWith("https://")) return v;

    if (v.includes(".") && !v.includes(" ")) return "https://" + v;

    return "https://www.google.com/search?q=" + encodeURIComponent(v);
}

function loadURL(value) {
    if (!activeTab) return;

    const u = normalizeURL(value);

    try {
        activeTab.webview.loadURL(u);
    } catch {
        activeTab.webview.src = u;
    }
}


// ========================================================
// DEVTOOLS SUPPORT
// ========================================================

// Global window devtools button
devtoolsBtn.onclick = () => {
    window.electronAPI.toggleDevTools();
};

// Per-tab DevTools (F12)
document.addEventListener("keydown", (e) => {
    if (e.key === "F12" && activeTab) {
        activeTab.webview.openDevTools();
    }
});


// ========================================================
// TABS + WEBVIEW MANAGEMENT
// ========================================================
function newTab(url = "https://www.google.com/") {

    const id = Date.now();

    // Create tab element
    const tabEl = document.createElement("div");
    tabEl.className = "tab";

    const fav = document.createElement("img");
    fav.className = "tab-favicon";
    fav.src = "./icons/default-favicon.png";

    const titleEl = document.createElement("div");
    titleEl.className = "tab-title";
    titleEl.textContent = "New Tab";

    const closeEl = document.createElement("div");
    closeEl.className = "close-tab";
    closeEl.textContent = "×";

    tabEl.appendChild(fav);
    tabEl.appendChild(titleEl);
    tabEl.appendChild(closeEl);
    tabContainer.appendChild(tabEl);

    // Create webview
    const webview = document.createElement("webview");
    webview.className = "webview";
    webview.src = url;
    webview.setAttribute("allowpopups", "true"); // <-- FIX POPUP ISSUE
    webview.setAttribute("preload", "../preload.js");
    webview.style.display = "none";
    viewContainer.appendChild(webview);

    const tab = { id, tabEl, fav, titleEl, closeEl, webview };
    tabs.push(tab);

    // Events
    tabEl.onclick = () => setActiveTab(tab);
    closeEl.onclick = (ev) => { ev.stopPropagation(); closeTab(tab); };

    webview.addEventListener("page-title-updated", (e) => {
        titleEl.textContent = e.title;
        tabEl.title = e.title;
    });

    webview.addEventListener("page-favicon-updated", (e) => {
        if (e.favicons && e.favicons.length) {
            fav.src = e.favicons[0];
            if (activeTab === tab) urlFavicon.src = e.favicons[0];
        }
    });

    webview.addEventListener("did-stop-loading", () => {
        const u = webview.getURL();
        urlInput.value = u;

        if (u.startsWith("https://")) {
            lockIcon.textContent = "🔒";
        } else {
            lockIcon.textContent = "⚠️";
        }

        window.electronAPI.saveHistory({
            url: u,
            title: titleEl.textContent,
            time: new Date().toISOString()
        });

        errorScreen.classList.add("hidden");
    });

    webview.addEventListener("did-fail-load", (e) => {
        if (e.errorCode !== -3) {
            errorDesc.textContent = `${e.errorDescription}`;
            errorScreen.classList.remove("hidden");
        }
    });

    webview.addEventListener("new-window", (e) => {
        newTab(e.url);
    });

    setActiveTab(tab);
}

function setActiveTab(tab) {
    tabs.forEach(t => {
        t.tabEl.classList.remove("active");
        t.webview.style.display = "none";
    });

    activeTab = tab;
    tab.tabEl.classList.add("active");
    tab.webview.style.display = "flex";

    urlInput.value = tab.webview.getURL();
    urlFavicon.src = tab.fav.src;
}

function closeTab(tab) {
    tab.tabEl.remove();
    tab.webview.remove();

    tabs = tabs.filter(t => t !== tab);

    if (!tabs.length) {
        newTab();
    } else {
        setActiveTab(tabs[tabs.length - 1]);
    }
}


// ========================================================
// INIT
// ========================================================
newTab("https://www.google.com/");
retryBtn.onclick = () => loadURL(urlInput.value);

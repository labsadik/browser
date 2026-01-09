
const { app, BrowserWindow, ipcMain, session, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const tls = require("tls");
const { URL } = require("url");

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    fs.writeFileSync(file, "[]", "utf8");
    return [];
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

app.commandLine.appendSwitch("remote-debugging-port", "9222");

function createWindow() {
  const win = new BrowserWindow({
    width: 720, height: 610, minWidth: 400, minHeight: 300,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
      webviewTag: true,
      webSecurity: true
    }
  });

  win.setMenu(null);

  session.defaultSession.on("will-download", async (event, item) => {
    try {
      const filename = item.getFilename();
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: "Save file",
        defaultPath: filename
      });
      if (canceled || !filePath) { item.cancel(); return; }
      item.setSavePath(filePath);
      const file = path.join(DATA_DIR, "downloads.json");
      const list = readJSON(file);
      list.push({ filename, path: filePath, time: new Date().toISOString() });
      writeJSON(file, list);
    } catch (err) {
      console.error("Download error:", err);
      item.cancel();
    }
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = new Set(["fullscreen", "openExternal"]);
    if (allowed.has(permission)) return callback(true);
    return callback(false);
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  return win;
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.on("window-minimize", () => {
    const w = BrowserWindow.getFocusedWindow(); if (w) w.minimize();
  });
  ipcMain.on("window-maximize", () => {
    const w = BrowserWindow.getFocusedWindow(); if (w) (w.isMaximized() ? w.unmaximize() : w.maximize());
  });
  ipcMain.on("window-close", () => {
    const w = BrowserWindow.getFocusedWindow(); if (w) w.close();
  });

  ipcMain.on("save-bookmark", (e, data) => {
    const file = path.join(DATA_DIR, "bookmarks.json");
    const list = readJSON(file);
    list.push(data);
    writeJSON(file, list);
  });

  ipcMain.on("save-history", (e, data) => {
    const file = path.join(DATA_DIR, "history.json");
    const list = readJSON(file);
    list.push(data);
    writeJSON(file, list);
  });

  ipcMain.on("open-link-in-tab", (_, url) => {
    const w = BrowserWindow.getFocusedWindow(); if (w) w.webContents.send("new-tab-url", url);
  });

  // downloads
  ipcMain.handle("get-downloads", async () => {
    try { return { ok: true, list: readJSON(path.join(DATA_DIR, "downloads.json")) }; }
    catch (err) { return { ok: false, error: String(err) }; }
  });
  ipcMain.handle("open-path", async (_, p) => {
    try { const r = await shell.openPath(p); return { ok: true, result: r }; }
    catch (err) { return { ok: false, error: String(err) }; }
  });
  ipcMain.handle("clear-downloads", async () => {
    try { writeJSON(path.join(DATA_DIR, "downloads.json"), []); return { ok: true }; }
    catch (err) { return { ok: false, error: String(err) }; }
  });

  // history
  ipcMain.handle("get-history", async () => {
    try { return { ok: true, list: readJSON(path.join(DATA_DIR, "history.json")) }; }
    catch (err) { return { ok: false, error: String(err) }; }
  });
  ipcMain.handle("clear-history", async () => {
    try { writeJSON(path.join(DATA_DIR, "history.json"), []); return { ok: true }; }
    catch (err) { return { ok: false, error: String(err) }; }
  });

  // bookmarks
  ipcMain.handle("get-bookmarks", async () => {
    try { return { ok: true, list: readJSON(path.join(DATA_DIR, "bookmarks.json")) }; }
    catch (err) { return { ok: false, error: String(err) }; }
  });
  ipcMain.handle("clear-bookmarks", async () => {
    try { writeJSON(path.join(DATA_DIR, "bookmarks.json"), []); return { ok: true }; }
    catch (err) { return { ok: false, error: String(err) }; }
  });

  // TLS cert
  ipcMain.handle("get-cert", async (_, pageUrl) => {
    try {
      if (!pageUrl) throw new Error("No URL");
      const parsed = new URL(pageUrl);
      const host = parsed.hostname;
      const port = parsed.port ? Number(parsed.port) : 443;
      return await new Promise((resolve) => {
        const socket = tls.connect({ host, port, servername: host, timeout: 9000, rejectUnauthorized: false }, () => {
          try {
            const cert = socket.getPeerCertificate(true);
            socket.end();
            if (!cert || Object.keys(cert).length === 0) return resolve({ ok: false, error: "No certificate returned" });
            const info = {
              subject: cert.subject,
              issuer: cert.issuer,
              valid_from: cert.valid_from,
              valid_to: cert.valid_to,
              fingerprint: cert.fingerprint || cert.fingerprint256,
              raw: cert
            };
            resolve({ ok: true, cert: info });
          } catch (err) {
            socket.end();
            resolve({ ok: false, error: String(err) });
          }
        });
        socket.on("error", (err) => resolve({ ok: false, error: String(err) }));
        socket.on("timeout", () => { socket.destroy(); resolve({ ok: false, error: "Timeout fetching certificate" }); });
      });
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  // fetch page metadata (title + favicon)
  ipcMain.handle("fetch-metadata", async (_, pageUrl) => {
    try {
      if (!pageUrl) throw new Error("No URL");
      const isHttps = pageUrl.startsWith("https:");
      const httpx = isHttps ? require("https") : require("http");
      return await new Promise((resolve) => {
        const req = httpx.get(pageUrl, { timeout: 9000, headers: { "User-Agent": "Mozilla/5.0 (Electron) MetadataFetcher/1.0" } }, (res) => {
          let data = "";
          res.setEncoding("utf8");
          res.on("data", (c) => { data += c; if (data.length > 200000) req.destroy(); });
          res.on("end", () => {
            try {
              const titleMatch = data.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
              const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "";
              let icon = "";
              const rels = [...data.matchAll(/<link[^>]+rel=["']?([^"'>]+)["']?[^>]*>/ig)];
              for (const m of rels) {
                const rel = m[1];
                const tag = m[0];
                if (/icon/i.test(rel)) {
                  const hrefMatch = tag.match(/href=["']?([^"'>\s]+)["']?/i);
                  if (hrefMatch) { icon = hrefMatch[1]; break; }
                }
              }
              if (icon && !/^https?:\/\//i.test(icon)) {
                const u = new URL(pageUrl);
                if (icon.startsWith("/")) icon = `${u.protocol}//${u.host}${icon}`;
                else icon = `${u.protocol}//${u.host}/${icon}`;
              }
              resolve({ ok: true, title: title || (new URL(pageUrl)).hostname, favicon: icon || "" });
            } catch (err) { resolve({ ok: false, error: String(err) }); }
          });
        });
        req.on("error", (err) => resolve({ ok: false, error: String(err) }));
        req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "Timeout" }); });
      });
    } catch (err) { return { ok: false, error: String(err) }; }
  });

});

app.on("window-all-closed", () => app.quit());

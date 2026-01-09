
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  saveBookmark: (data) => ipcRenderer.send("save-bookmark", data),
  saveHistory: (data) => ipcRenderer.send("save-history", data),
  openLinkInNewTab: (url) => ipcRenderer.send("open-link-in-tab", url),
  onNewTabURL: (cb) => ipcRenderer.on("new-tab-url", (_, url) => cb(url)),
  getDownloads: () => ipcRenderer.invoke("get-downloads"),
  openPath: (p) => ipcRenderer.invoke("open-path", p),
  clearDownloads: () => ipcRenderer.invoke("clear-downloads"),
  getHistory: () => ipcRenderer.invoke("get-history"),
  clearHistory: () => ipcRenderer.invoke("clear-history"),
  getBookmarks: () => ipcRenderer.invoke("get-bookmarks"),
  clearBookmarks: () => ipcRenderer.invoke("clear-bookmarks"),
  getCertificate: (url) => ipcRenderer.invoke("get-cert", url),
  fetchMetadata: (url) => ipcRenderer.invoke("fetch-metadata", url)
});

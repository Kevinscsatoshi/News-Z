const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  copyToClipboard: (text) => ipcRenderer.invoke('clipboard:copy', text),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  shouldUseDarkColors: () => ipcRenderer.invoke('theme:should-use-dark-colors'),
  notifyRefresh: () => ipcRenderer.send('renderer:notify-refresh'),
  onRefreshAll: (callback) => {
    const subscription = (_event) => callback();
    ipcRenderer.on('renderer:refresh-all', subscription);
    return () => ipcRenderer.removeListener('renderer:refresh-all', subscription);
  },
  onStatusMessage: (callback) => {
    const subscription = (_event, message) => callback(message);
    ipcRenderer.on('renderer:status-message', subscription);
    return () => ipcRenderer.removeListener('renderer:status-message', subscription);
  }
});

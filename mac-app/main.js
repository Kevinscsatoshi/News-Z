const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Menu, shell, ipcMain, clipboard, nativeTheme } = require('electron');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow;

function resolveRendererPath(file) {
  const packagedPath = path.join(__dirname, 'renderer', file);
  if (fs.existsSync(packagedPath)) {
    return packagedPath;
  }
  return path.join(__dirname, '..', file);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0f172a',
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: false,
      devTools: true
    }
  });

  mainWindow.loadFile(resolveRendererPath('index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '文件',
      submenu: [
        {
          label: '刷新链上数据',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('renderer:refresh-all');
            }
          }
        },
        { type: 'separator' },
        {
          label: '导出截图…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            if (!mainWindow) return;
            mainWindow.webContents.capturePage().then((image) => {
              const filePath = path.join(app.getPath('pictures'), `ETH-Monitor-${Date.now()}.png`);
              require('fs').writeFileSync(filePath, image.toPNG());
              mainWindow.webContents.send('renderer:status-message', `截图已保存到 ${filePath}`);
            });
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggledevtools' }
      ]
    },
    {
      role: 'windowMenu'
    },
    {
      role: 'help',
      submenu: [
        {
          label: '查看使用说明',
          click: () => shell.openExternal('https://www.okx.com/cn/web3')
        },
        {
          label: '项目仓库',
          click: () => shell.openExternal('https://github.com/ChainIntelligenceLab/news-z')
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  createMainWindow();
  buildMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('clipboard:copy', (_event, text) => {
  if (typeof text === 'string' && text.length > 0) {
    clipboard.writeText(text);
    return true;
  }
  return false;
});

ipcMain.handle('open-external', (_event, url) => {
  if (typeof url === 'string' && url.startsWith('http')) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('theme:should-use-dark-colors', () => nativeTheme.shouldUseDarkColors);

ipcMain.on('renderer:notify-refresh', () => {
  if (mainWindow) {
    mainWindow.webContents.send('renderer:refresh-all');
  }
});

import { app, BrowserWindow } from 'electron';
import electronReload from 'electron-reload';
import isDev from 'electron-is-dev';
import path from 'path';

const htmlFile = path.join(__dirname, '../index.html');
let mainWindow: Electron.BrowserWindow | null;

if (isDev) {
  electronReload(__dirname);

  // Получение пути файловой системы, где находится приложение
  console.log(app.getAppPath());

  // Получение путей к стандартным папкам файловой системы
  console.log(app.getPath('desktop'));
  console.log(app.getPath('music'));
  console.log(app.getPath('temp'));
  console.log(app.getPath('userData'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile(htmlFile);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.once('ready-to-show', () => {
    if (mainWindow !== null) {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', createWindow);

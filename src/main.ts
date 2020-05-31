import { app, BrowserWindow } from 'electron';
import path from 'path';

const htmlFile = path.join(__dirname, '../index.html');
let mainWindow: Electron.BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile(htmlFile);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', createWindow);

import {
  app,
} from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import MainWindow from './main-window';

const htmlFile = path.resolve(__dirname, '../index.html');
const preloadScript = path.resolve(__dirname, '../context-bridge/index.js');

if (isDev) {
  require('electron-reload')(path.resolve(__dirname, '..'));
}

export default function main(windowOptions: Record<string, any> = {}) {
  const mainWindow = new MainWindow({
    ...windowOptions,
    isDev,
    htmlFile,
    preload: preloadScript,
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('ready', () => {
    mainWindow.create();
  });
}

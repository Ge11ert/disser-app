import { app, BrowserWindow, ipcMain, dialog, IpcMainEvent, OpenDialogReturnValue } from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import AirConditionsParser from './parsers/air-conditions-parser';
import XlsReader from './readers/xls-reader';

const htmlFile = path.join(__dirname, '../index.html');
let mainWindow: Electron.BrowserWindow | null;

if (isDev) {
  require('electron-reload')([
    __dirname,
    path.join(__dirname, './parsers')
  ]);

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
    height: 900,
    width: 1200,
    show: false,
    webPreferences: {
      contextIsolation: true,
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

ipcMain.on('formSubmit', (event: IpcMainEvent, arg) => {
  console.log(arg);
  event.sender.send('formResponse', `Hello, ${arg}`);
});

ipcMain.on('showOpenDialog', (event: IpcMainEvent,) => {
  if (mainWindow) {
    dialog.showOpenDialog(mainWindow, {
      title: 'Open a file',
      defaultPath: app.getPath('home'),
      properties: [
        'openFile',
      ],
    }).then((result: OpenDialogReturnValue) => {
      console.log(result.canceled);
      console.log(result.filePaths);
      if (!result.canceled) {
        const reader = new XlsReader();
        const parser = new AirConditionsParser(result.filePaths[0], reader);
        parser.parse().then((airConditions) => {
          event.sender.send('fileSelected', airConditions);
        });
      }
    });
  }
});

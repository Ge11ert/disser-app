import { app, BrowserWindow, ipcMain, dialog, IpcMainEvent, OpenDialogReturnValue } from 'electron';
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
        event.sender.send('fileSelected', result.filePaths[0]);
      }
    });
  }
});

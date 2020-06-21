import { App, ipcMain, IpcMainEvent, dialog, OpenDialogReturnValue, BrowserWindow } from 'electron';
import { LOAD_AIR_CONDITIONS } from './event-names';
import AirConditionsParser from '../../utils/parsers/air-conditions-parser';
import XlsReader from '../../utils/readers/xls-reader';
import { DisserAppAPI } from '../../types/interfaces';

export default function bindEvents(electronApp: App, disserApp: DisserAppAPI, browserWindow: BrowserWindow) {
  ipcMain.on(LOAD_AIR_CONDITIONS, (event: IpcMainEvent) => {
    dialog.showOpenDialog(browserWindow, {
      title: 'Open a file',
      defaultPath: electronApp.getPath('home'),
      properties: [
        'openFile',
      ],
    }).then((result: OpenDialogReturnValue) => {
      if (!result.canceled) {
        const reader = new XlsReader();
        const parser = new AirConditionsParser(result.filePaths[0], reader);
        parser.parse().then(result => {
          disserApp.applyAirConditions(result);
        });
      }
    });
  });
}

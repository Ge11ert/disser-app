import { App, ipcMain, IpcMainEvent, dialog, OpenDialogReturnValue, BrowserWindow } from 'electron';
import {
  APPLY_ARRIVAL_TIME,
  APPLY_INITIAL_CONDITIONS,
  LOAD_AIR_CONDITIONS,
  RENDER_AIR_CONDITIONS,
  START_FINDER,
} from './event-names';
import AirConditionsParser from '../../utils/parsers/air-conditions-parser';
import XlsReader from '../../utils/readers/xls-reader';
import { DisserAppAPI } from '../../types/interfaces';

export default function bindEvents(electronApp: App, disserApp: DisserAppAPI, browserWindow: BrowserWindow) {
  ipcMain.on(LOAD_AIR_CONDITIONS, (event: IpcMainEvent, disableWind: boolean) => {
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
          const possibleAlts = disserApp.getAltitudeList();
          possibleAlts.forEach(alt => {
            disserApp.registerAirConditionsForAltitude(result.get(alt), alt, disableWind);
          });
          event.sender.send(RENDER_AIR_CONDITIONS, result);
        });
      }
    });
  });

  ipcMain.on(START_FINDER, () => {
    try {
      disserApp.startFinder();
    } catch (e) {
      console.log(e);
    }
  });

  ipcMain.on(APPLY_INITIAL_CONDITIONS, (event, conditions) => {
    try {
      disserApp.applyInitialGeoConditions(conditions);
    } catch (e) {
      console.log(e);
    }
  });

  ipcMain.on(APPLY_ARRIVAL_TIME, (event, time) => {
    try {
      disserApp.applyArrivalTime(time);
    } catch (e) {
      console.log(e);
    }
  })
}

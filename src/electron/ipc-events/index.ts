import { App, ipcMain, IpcMainEvent, dialog, OpenDialogReturnValue, BrowserWindow } from 'electron';
import {
  APPLY_ARRIVAL_TIME,
  APPLY_INITIAL_CONDITIONS,
  LOAD_AIR_CONDITIONS,
  RENDER_AIR_CONDITIONS,
  CANCEL_AIR_CONDITIONS,
  START_FINDER,
} from './event-names';
import AirConditionsParser from '../../utils/parsers/air-conditions-parser';
import XlsReader from '../../utils/readers/xls-reader';
import { DisserAppAPI, AirConditions } from '../../types/interfaces';

export default function bindEvents(electronApp: App, disserApp: DisserAppAPI, browserWindow: BrowserWindow) {
  ipcMain.on(LOAD_AIR_CONDITIONS, (event: IpcMainEvent, disableWind: boolean, disableZones: boolean) => {
    dialog.showOpenDialog(browserWindow, {
      title: 'Open a file',
      defaultPath: electronApp.getPath('home'),
      properties: [
        'openFile',
      ],
    }).then(async (result: OpenDialogReturnValue) => {
      if (result.canceled) {
        event.sender.send(CANCEL_AIR_CONDITIONS);
        return;
      }

      const reader = new XlsReader();
      const parser = new AirConditionsParser(result.filePaths[0], reader);
      try {
        const result = await parser.parse();
        const processedConditionsMap = (disableWind || disableZones) ? processAirConditions(result, disableWind, disableZones) : result;

        const possibleAlts = disserApp.getAltitudeList();
        possibleAlts.forEach(alt => {
          disserApp.registerAirConditionsForAltitude(processedConditionsMap.get(alt), alt, disableWind);
        });
        event.sender.send(RENDER_AIR_CONDITIONS, processedConditionsMap);
      } catch (error) {
        event.sender.send(CANCEL_AIR_CONDITIONS);
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

function processAirConditions(
  initialMap: Map<number, AirConditions>, disableWind: boolean, disableZones: boolean
): Map<number, AirConditions> {
  const processed = new Map<number, AirConditions>();

  initialMap.forEach((value, key) => {
    processed.set(key, disableWindAndZones(value, disableWind, disableZones));
  });
  return processed;
}

function disableWindAndZones(conditions: AirConditions, disableWind: boolean, disableZones: boolean): AirConditions {
  return conditions.map((row) => row.map(cell => {
    const isNullCell = (
      (disableZones && disableWind)
      || (disableWind && typeof cell === 'number')
      || (disableZones && typeof cell === 'string')
    );

    if (isNullCell) return 0;

    return cell;
  }));
}

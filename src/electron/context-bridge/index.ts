// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer } from 'electron';
import {
  LOAD_AIR_CONDITIONS,
  RENDER_AIR_CONDITIONS,
  CANCEL_AIR_CONDITIONS,
  RENDER_OPTIMAL_PATHS,
  START_FINDER,
  RENDER_TOTAL_RUN,
  RENDER_RTA_PATH,
  APPLY_INITIAL_CONDITIONS,
  REQUEST_ARRIVAL_TIME,
  APPLY_ARRIVAL_TIME,
  SEND_INITIAL_POINTS,
  SEND_CALCULATION_TIME,
} from '../ipc-events/event-names';
import { ElectronWindowAPI } from '../../types/interfaces';

const electronToWindowAPI: ElectronWindowAPI = {
  loadAirConditions: (disableWind, disableZones) => {
    ipcRenderer.send(LOAD_AIR_CONDITIONS, disableWind, disableZones);
  },
  listenToAirConditionsLoaded: (callback: (arg: any) => void) => {
    ipcRenderer.on(RENDER_AIR_CONDITIONS, (event, airConditions: any) => {
      callback(airConditions);
    });
  },
  listenToAirConditionsCancelled(callback: () => void) {
    ipcRenderer.on(CANCEL_AIR_CONDITIONS, callback);
  },
  listenToFlightRoutesCalculated: (callback: (arg: any) => void) => {
    ipcRenderer.on(RENDER_TOTAL_RUN, (event, routes: any) => {
      callback(routes);
    });
  },
  listenToOptimalPathsFound: (callback: (arg: any) => void) => {
    ipcRenderer.on(RENDER_OPTIMAL_PATHS, (event, routes: any) => {
      callback(routes);
    });
  },
  listenToRTAPathFound: (callback: (arg: any) => void) => {
    ipcRenderer.on(RENDER_RTA_PATH, (event, rtaPath: any) => {
      callback(rtaPath);
    });
  },
  listenToArrivalTimeRequest: (callback: (arg: any) => void) => {
    ipcRenderer.on(REQUEST_ARRIVAL_TIME, (event, possibleArrivalTimes: any) => {
      callback(possibleArrivalTimes);
    });
  },
  findPath: () => {
    ipcRenderer.send(START_FINDER);
  },
  applyInitialConditions: (conditions) => {
    ipcRenderer.send(APPLY_INITIAL_CONDITIONS, conditions);
  },
  applyArrivalTime(time: string) {
    ipcRenderer.send(APPLY_ARRIVAL_TIME, time);
  },
  listenToInitialPoints: (callback: (arg: any) => void) => {
    ipcRenderer.on(SEND_INITIAL_POINTS, (event, initialPoints: any) => {
      callback(initialPoints);
    });
  },
  listenToCalculationTime: (callback: (arg: any) => void) => {
    ipcRenderer.on(SEND_CALCULATION_TIME, (event, calculationTime: any) => {
      callback(calculationTime);
    });
  },
};

contextBridge.exposeInMainWorld('electron', electronToWindowAPI);

function renderAirConditions(rows: any[][]) {
  return renderRows(rows, getCellLabel);
}

function renderFinderGrid(rows: any[][]) {
  return renderRows(rows, getFinderGridCellLabel);
}

function renderRows(rows: any[][], cellRenderer: Function): string {
  return rows.map(row => `<tr>${renderRow(row, cellRenderer)}</tr>`).join('');
}

function renderRow(row: any[], cellRenderer: Function): string {
  return row.map(cell => `<td width="100px">${cellRenderer(cell)}</td>`).join('');
}

function getCellLabel(cell: number|string): string {
  if (typeof cell === 'number') {
    if (cell < 0) {
      return `\u2b05 ${cell}`;
    }
    if (cell > 0) {
      return `\u2b95 ${cell}`;
    }
    return `~~~ ${cell}`;
  } else {
    return '\u2612';
  }
}

function getFinderGridCellLabel(cell: { x: number, y: number, g: number, h: number, f: number, walkable: boolean, inPath: boolean }) {
  if (!cell.walkable) {
    return `<span style="color: red;">xxx<br/>xxx<br/>xxx</span>`;
  }
  const style = cell.inPath ? 'color: green; font-weight: 700;' : '';
  return `<span style="${style}">g: ${cell.g.toPrecision(3)}<br/>h: ${cell.h.toPrecision(3)}<br/>f: ${cell.f.toPrecision(3)}</span>`;
}

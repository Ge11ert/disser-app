// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer } from 'electron';
import {
  LOAD_AIR_CONDITIONS,
  RENDER_AIR_CONDITIONS,
  RENDER_OPTIMAL_PATHS,
  START_FINDER,
  RENDER_TOTAL_RUN,
  APPLY_INITIAL_CONDITIONS,
} from '../ipc-events/event-names';
import { ElectronWindowAPI } from '../../types/interfaces';

const electronToWindowAPI: ElectronWindowAPI = {
  loadAirConditions: () => {
    ipcRenderer.send(LOAD_AIR_CONDITIONS);
  },
  listenToAirConditionsLoaded: (callback: (arg: any) => void) => {
    ipcRenderer.on(RENDER_AIR_CONDITIONS, (event, airConditions: any) => {
      callback(airConditions);
    });
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
  findPath: () => {
    ipcRenderer.send(START_FINDER);
  },
  applyInitialConditions: (conditions) => {
    ipcRenderer.send(APPLY_INITIAL_CONDITIONS, conditions);
  }
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

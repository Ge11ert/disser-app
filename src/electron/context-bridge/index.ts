// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer } from 'electron';
import { LOAD_AIR_CONDITIONS, RENDER_AIR_CONDITIONS, START_FINDER } from '../ipc-events/event-names';
import { ElectronWindowAPI } from '../../types/interfaces';

const electronToWindowAPI: ElectronWindowAPI = {
  loadAirConditions: () => {
    ipcRenderer.send(LOAD_AIR_CONDITIONS);
  },
  listenToAirConditionsLoaded: () => {
    ipcRenderer.on(RENDER_AIR_CONDITIONS, (event, arg: any[][]) => {
      const resultElement = document.querySelector('.file-selector__result');
      if (resultElement) {
        const rowsHtml = renderRows(arg);
        resultElement.innerHTML = `<table>${rowsHtml}</table>`;
      }
    });
  },
  findPath: () => {
    ipcRenderer.send(START_FINDER);
  },
};

contextBridge.exposeInMainWorld('electron', electronToWindowAPI);

function renderRows(rows: any[][]): string {
  return rows.map(row => `<tr>${renderRow(row)}</tr>`).join('');
}

function renderRow(row: any[]): string {
  return row.map(cell => `<td width="100px">${getCellLabel(cell)}</td>`).join('');
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

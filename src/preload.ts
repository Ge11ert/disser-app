// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  doMagic: (textValue: string): void => {
    ipcRenderer.send('formSubmit', textValue);
  },
  listenToMagic: (): void => {
    ipcRenderer.on('formResponse', (event, arg) => {
      console.log(`Whoa: ${arg}`);
      const resultElement = document.querySelector('.result');
      if (resultElement) {
        resultElement.innerHTML = `Whoa: ${arg}`;
      }
    });
  },
  openFile: () => {
    ipcRenderer.send('showOpenDialog');
  },
  listenToFileSelect: () => {
    ipcRenderer.on('fileSelected', (event, arg: any[][]) => {
      const resultElement = document.querySelector('.file-selector__result');
      if (resultElement) {
        const rowsHtml = renderRows(arg);
        console.log(rowsHtml);
        resultElement.innerHTML = `<table>${rowsHtml}</table>`;
        // resultElement.innerHTML = `Air Conditions from file:\n${JSON.stringify(arg)}`;
      }
    });
  },
});

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

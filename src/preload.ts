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
    });
  }
});

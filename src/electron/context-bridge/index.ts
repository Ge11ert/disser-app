// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer } from 'electron';
import { LOAD_AIR_CONDITIONS } from '../ipc-events/event-names';
import { ElectronWindowAPI } from '../../types/interfaces';

const electronToWindowAPI: ElectronWindowAPI = {
  loadAirConditions: () => {
    ipcRenderer.send(LOAD_AIR_CONDITIONS);
  },
};

contextBridge.exposeInMainWorld('electron', electronToWindowAPI);

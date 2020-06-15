// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer } from 'electron';
import { ElectronWindowAPI } from '../../types/interfaces';

const electronToWindowAPI: ElectronWindowAPI = {};

contextBridge.exposeInMainWorld('electron', electronToWindowAPI);

import { ElectronWindowAPI } from '../../interfaces';

export declare global {
  interface Window {
    electron: ElectronWindowAPI;
  }
}

import {
  app,
} from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import MainWindow from './main-window';
import bindIpcEvents from '../ipc-events';
import { DisserAppAPI } from '../../types/interfaces';
import {
  RENDER_TOTAL_RUN,
  RENDER_OPTIMAL_PATHS,
  RENDER_RTA_PATH,
  REQUEST_ARRIVAL_TIME,
  SEND_INITIAL_POINTS,
  SEND_CALCULATION_TIME,
} from '../ipc-events/event-names';

const htmlFile = path.resolve(__dirname, '../renderer/index.html');
const preloadScript = path.resolve(__dirname, '../context-bridge/index.js');

if (isDev) {
  require('electron-reload')(path.resolve(__dirname, '..'));
}

export default class ElectronApp {
  private mainWindow: MainWindow;

  constructor(
    private windowOptions: Record<string, any> = {},
    private disserApp: DisserAppAPI
  ) {
    this.mainWindow = new MainWindow({
      ...windowOptions,
      isDev,
      htmlFile,
      preload: preloadScript,
    });
  }

  start(): void {
    app.on('window-all-closed', () => {
      app.quit();
    });

    app.on('ready', () => {
      this.mainWindow.create();
      bindIpcEvents(app, this.disserApp, this.mainWindow.getBrowserWindow());
    });
  }

  sendToWindow(eventName: any, data: any): void {
    this.mainWindow.getBrowserWindow().webContents.send(eventName, data);
  }

  renderTotalRun(data: any): void {
    this.sendToWindow(RENDER_TOTAL_RUN, data);
  }

  renderOptimalPaths(data: any): void {
    this.sendToWindow(RENDER_OPTIMAL_PATHS, data);
  }

  renderRTAPath(data: any): void {
    this.sendToWindow(RENDER_RTA_PATH, data);
  }

  requestArrivalTime(data: any): void {
    this.sendToWindow(REQUEST_ARRIVAL_TIME, data);
  }

  sendInitialPoints(data: any): void {
    this.sendToWindow(SEND_INITIAL_POINTS, data);
  }

  sendCalculationTime(data: any): void {
    this.sendToWindow(SEND_CALCULATION_TIME, data);
  }
}

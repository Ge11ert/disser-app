import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
} from 'electron';

export interface MainWindowOptions extends BrowserWindowConstructorOptions {
  isDev?: boolean;
  preload: string,
  htmlFile: string,
}

const defaultOptions: BrowserWindowConstructorOptions = {
  show: false,
  webPreferences: {
    contextIsolation: true,
  },
};

class MainWindow {
  private window: Electron.BrowserWindow | null = null;

  private readonly windowOptions: MainWindowOptions;

  constructor(options: MainWindowOptions) {
    this.windowOptions = {
      ...defaultOptions,
      ...options,
      webPreferences: {
        ...defaultOptions.webPreferences,
        preload: options.preload,
      }
    };
  }

  create() {
    this.window = new BrowserWindow(this.windowOptions);

    this.window.loadFile(this.windowOptions.htmlFile);

    if (this.windowOptions.isDev) {
      this.window.webContents.openDevTools();
    }

    this.window.once('ready-to-show', () => {
      if (this.window !== null) {
        this.window.show();
      }
    });

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  getBrowserWindow(): BrowserWindow {
    if (!this.window) {
      this.create();
    }
    return this.window!;
  }
}

export default MainWindow;

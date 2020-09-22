import { BrowserWindowConstructorOptions } from 'electron';

const electronOptions: BrowserWindowConstructorOptions = {
  minWidth: 800,
  width: 1920,
  height: 1080,
  minHeight: 600,
};

const environmentSettings = {
  minM: 0.71,
  maxM: 0.81,
  minH: 20000,
  maxH: 40000,
  altitudeIncrement: 2000,
  machIncrement: 0.01,
};

export default {
  electron: electronOptions,
  environment: environmentSettings,
};

import { BrowserWindowConstructorOptions } from 'electron';

const electronOptions: BrowserWindowConstructorOptions = {
  minWidth: 800,
  width: 1200,
  height: 900,
  minHeight: 600,
}

export default {
  electron: electronOptions,
};

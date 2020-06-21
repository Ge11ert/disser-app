import startElectronApp from './electron/server';
import { DisserAppAPI, AirConditions } from './types/interfaces';

export default class DisserApp implements DisserAppAPI {
  constructor(public settings: { electron: Record<string, any> }) {}

  startElectronApp() {
    startElectronApp(this.settings.electron, this);
  }

  applyAirConditions(airConditions: AirConditions) {
    console.log(airConditions);
  }
}

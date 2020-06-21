type AirConditionsWind = number;
type AirConditionsWall = 'x' | 'X';

export type AirConditionsCell = AirConditionsWind | AirConditionsWall;
export type AirConditions = AirConditionsCell[][];

export type readResult<T> = {
  status: string,
  result: T,
};

export interface Reader<T> {
  read(path: string): Promise<readResult<T>>
}

export interface ElectronWindowAPI {
  loadAirConditions: () => void;
  listenToAirConditionsLoaded: () => void;
  findPath: () => void;
}

export interface DisserAppAPI {
  startElectronApp: () => void;

  applyAirConditions: (airConditionsArray: AirConditions) => void;

  startFinder: () => void;
}

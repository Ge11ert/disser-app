type AirConditionsWind = number;
type AirConditionsWall = 'x' | 'X';

export type FlightProfileHeaderRow = string[];
export type FlightProfileDataRow = (number|string)[];
type SpeedM = number;
type SpeedOfSound = number;
type Altitude = number;
type Fuel = number;
type SpeedV = number;
type Distance = number;
type Time = number;

export type AirConditionsCell = AirConditionsWind | AirConditionsWall;
export type AirConditions = AirConditionsCell[][];

export type FlightProfile = (FlightProfileHeaderRow|FlightProfileDataRow)[];

export type CruiseProfile = [SpeedM, SpeedOfSound, Altitude, Fuel, SpeedV][];
export type ClimbProfile = [SpeedM, SpeedOfSound, Altitude, Fuel, Fuel, Distance, Distance, SpeedV, Time][];

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
  listenToMainAppData: () => void;
  findPath: () => void;
  applyInitialConditions: (conditions: Record<string, string>) => void;
}

export interface DisserAppAPI {
  startElectronApp: () => void;

  applyAirConditions: (airConditionsArray: AirConditions) => void;

  applyInitialGeoConditions: (geoConditions: Record<string, string>) => void;

  startFinder: () => void;
}

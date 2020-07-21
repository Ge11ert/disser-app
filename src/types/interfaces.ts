type AirConditionsWind = number;
type AirConditionsWall = 'x' | 'X';

export type FlightProfileHeaderRow = string[];
export type FlightProfileDataRow = (number|string)[];

export type AirConditionsCell = AirConditionsWind | AirConditionsWall;
export type AirConditions = AirConditionsCell[][];

export type FlightProfile = (FlightProfileHeaderRow|FlightProfileDataRow)[];

export type CruiseProfile = {
  speedM: number,
  speedOfSound: number,
  altitude: number,
  fuel: number,
  speedV: number,
}[];

export type ClimbDescentProfile = {
  speedM: number,
  speedOfSound: number,
  altitude: number,
  fuelFrom0: number,
  fuelFromPrev: number,
  distanceFrom0: number,
  distanceFromPrev: number,
  speedV: number,
  time: number,
}[];

export type readResult<T> = {
  status: string,
  result: T,
};

export interface Reader<T> {
  read(path: string): Promise<readResult<T>>
}

export interface ElectronWindowAPI {
  loadAirConditions(): void;
  listenToAirConditionsLoaded(): void;
  listenToMainAppData(): void;
  findPath(): void;
  applyInitialConditions(conditions: Record<string, string>): void;
}

export interface DisserAppAPI {
  startElectronApp(): void;

  applyInitialGeoConditions(geoConditions: Record<string, string>): void;

  startFinder(): void;

  getAltitudeList(): number[];

  registerAirConditionsForAltitude(conditions: AirConditions, alt: number): void;
}

type RunInfo = { distanceInMiles: number, fuelBurnInKgs: number, timeInHours: number };
type PathInfo = { path: number[][] };
type RunInfoWithPath = RunInfo & PathInfo;
export type SingleAltitudeRun = { ascent: RunInfo, cruise: RunInfoWithPath, descent: RunInfo };
export type SingleSpeedRun = Map<number, SingleAltitudeRun>; // данные по всем высотам для указанной скорости
export type SpeedRun = Map<number, SingleSpeedRun>; // набор по всем скоростям
export type TotalRun = SpeedRun[];

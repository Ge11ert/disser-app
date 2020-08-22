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
  read(path: string, opts?: Record<string, any>): Promise<readResult<T>>;
  getSheetsList(path: string): Promise<readResult<{ name: string }[]>>;
}

export interface ElectronWindowAPI {
  loadAirConditions(): void;
  listenToAirConditionsLoaded(callback: () => void): void;
  listenToMainAppData(): void;
  findPath(): void;
  applyInitialConditions(conditions: Record<string, string>): void;
}

export interface DisserAppAPI {
  startElectronApp(): void;

  applyInitialGeoConditions(geoConditions: Record<string, string>): void;

  startFinder(): void;

  getAltitudeList(): number[];

  registerAirConditionsForAltitude(conditions: AirConditions|undefined, alt: number): void;
}

type RunInfo = { distanceInMiles: number, fuelBurnInKgs: number, timeInHours: number, averageWind: number };
type PathInfo = { path: number[][] };
type RunInfoWithPath = RunInfo & PathInfo;
export type AltitudeRun = { ascent: RunInfo, cruise: RunInfoWithPath, descent: RunInfo };
export type SpeedRun = Map<number, AltitudeRun>; // данные по всем высотам для указанной скорости
export type TotalRun = Map<number, SpeedRun>; // набор по всем скоростям

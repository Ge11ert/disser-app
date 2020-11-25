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
  loadAirConditions(disableWind: boolean, disableZones: boolean): void;
  listenToAirConditionsLoaded(callback: (arg: any) => void): void;
  listenToAirConditionsCancelled(callback: () => void): void;
  listenToFlightRoutesCalculated(callback: (arg: any) => void): void;
  listenToOptimalPathsFound(callback: (arg: any) => void): void;
  listenToRTAPathFound(callback: (arg: any) => void): void;
  listenToArrivalTimeRequest(callback: (arg: any) => void): void;
  listenToInitialPoints(callback: (arg: any) => void): void;
  listenToCalculationTime(callback: (arg: any) => void): void;
  findPath(): void;
  applyInitialConditions(conditions: Record<string, string>): void;
  applyArrivalTime(time: string): void;
}

export interface DisserAppAPI {
  startElectronApp(): void;

  applyInitialGeoConditions(geoConditions: Record<string, string>): void;

  applyArrivalTime(time: string): void;

  startFinder(): void;

  getAltitudeList(): number[];

  registerAirConditionsForAltitude(conditions: AirConditions|undefined, alt: number, disableWind: boolean): void;
}

type RunInfo = { distanceInMiles: number, fuelBurnInKgs: number, timeInHours: number, averageWind: number };
type PathInfo = { path: number[][] };
type RunInfoWithPath = RunInfo & PathInfo;
export type AltitudeRun = { ascent: RunInfo, cruise: RunInfoWithPath, descent: RunInfo };
export type SpeedRun = Map<number, AltitudeRun>; // данные по всем высотам для указанной скорости
export type TotalRun = Map<number, SpeedRun>; // набор по всем скоростям

export type OptimalPath = {
  flightCost: number,
  fuel: number,
  time: number,
  distance: number,
  sections: {
    climb: number,
    cruise: number,
    descent: number,
  },
  speed: number,
  altitude: number,
  path: number[][],
  averageWind: number,
}

export type RtaOptimalPath = OptimalPath & {
  possibleAlternatives: OptimalPath[],
};

export type OptimalPathWithCoords = OptimalPath & { coords: { lat: number, long: number }[], zone?: { lat: number, long: number }[] };

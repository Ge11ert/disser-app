import ElectronApp from './electron/server';
import Grid from './pathfinding/core/grid';
import CruisePathFinder from './pathfinding/finder/cruise-path-finder';
import Geo from './geo';
import { cell } from './constants/grid';

import type { DisserAppAPI, AirConditions, CruiseProfile, ClimbProfile } from './types/interfaces';

const cruiseProfile: CruiseProfile = require('./assets/cruise_profile.json');
const climbProfile: ClimbProfile = require('./assets/climb_profile.json');

interface DisserAppSettings {
  electron: Record<string, any>;
  environment: {
    minM: number,
    maxM: number,
    minH: number,
    maxH: number,
    altitudeIncrement: number,
    machIncrement: number,
  };
}

export default class DisserApp implements DisserAppAPI {

  private readonly electronApp: ElectronApp;
  private readonly geo: Geo = new Geo();

  private airConditionsPerAlt: Record<number, AirConditions> = {};
  private airConditionsGridSize = { width: 0, height: 0 };
  private initialEntryPoint = { x: 0, y: 0};
  private initialExitPoint = { x: 0, y: 0};
  private readonly possibleAltitudeList: number[] = [];
  private readonly possibleMachList: number[] = [];

  private static createAltitudeList(env: DisserAppSettings['environment']) {
    const { minH, maxH, altitudeIncrement } = env;
    return createMinMaxList(minH, maxH, altitudeIncrement);
  }

  private static createMachSpeedList(env: DisserAppSettings['environment']) {
    const { minM, maxM, machIncrement } = env;
    return createMinMaxList(minM, maxM, machIncrement);
  }

  constructor(public settings: DisserAppSettings) {
    this.electronApp = new ElectronApp(settings.electron, this);
    this.possibleAltitudeList = DisserApp.createAltitudeList(settings.environment);
    this.possibleMachList = DisserApp.createMachSpeedList(settings.environment);
  }

  startElectronApp() {
    this.electronApp.start();
  }

  registerAirConditionsForAltitude(conditions: AirConditions, altitude: number) {
    if (!Array.isArray(conditions) || conditions.length === 0) {
      throw new Error(`Air conditions matrix for altitude ${altitude} is empty`);
    }

    if (this.airConditionsGridSize.width === 0 && this.airConditionsGridSize.height === 0) {
      this.airConditionsGridSize.height = conditions.length;
      this.airConditionsGridSize.width = conditions[0].length;

      this.createInitialEntryPoint();
      this.createInitialExitPoint();
    }

    if (
      conditions.length !== this.airConditionsGridSize.height
      || conditions[0].length !== this.airConditionsGridSize.width
    ) {
      throw new Error(`Air condition matrix for altitude ${altitude} has different size, which is no-op`);
    }

    this.airConditionsPerAlt[altitude] = conditions;
  }

  getAltitudeList() {
    return this.possibleAltitudeList;
  }

  applyInitialGeoConditions(geoConditions: Record<string, string>) {
    this.geo.applyStartAndFinalCoords(geoConditions);
    this.geo.findDistanceBetweenStartAndEndPoints();
    this.geo.findDistanceInGridCells();

    this.createInitialEntryPoint();
    this.createInitialExitPoint();
  }

  startFinder() {
    if (!this.geo.isCoordsLoaded()) {
      throw new Error('No coords for start and dest points');
    }

    if (Object.keys(this.airConditionsPerAlt).length === 0) {
      throw new Error('No air conditions loaded at all, please provide one');
    }

    // TODO: loop through all speeds
    [this.possibleMachList[3]].forEach(speedM => {
      this.performSpeedCycleStep(speedM);
    });
  }

  performSpeedCycleStep(speedValue: number) {
    const operatingAlt = this.possibleAltitudeList.filter(alt => (alt >= this.geo.startAltInFeet));

    for (let i = 0; i < operatingAlt.length; i++) {
      const alt = operatingAlt[i];
      const exitNow = this.performAltitudeCycleStep(speedValue, alt, i);
      if (exitNow) {
        return;
      }
    }
  }

  performAltitudeCycleStep(speedM: number, altitude: number, altIndex: number): boolean {
    const airConditions = this.airConditionsPerAlt[altitude];
    if (airConditions === undefined) {
      throw new Error(`No air conditions added for altitude ${altitude}`);
    }

    if (altIndex > 0) {
      // TODO: возвращать true, если altIndex > 0 (набор) И altIndex-1 имеет запретный участок на дистанции набора
      return true;
    }

    let finderGrid: Grid|null = new Grid(convertAirConditionsToWalkableMatrix(airConditions));
    finderGrid.setCellSize({ x: cell.H_SIZE, y: cell.V_SIZE });

    let finder: CruisePathFinder|null = new CruisePathFinder(
      { allowDiagonal: true },
      {
        profile: cruiseProfile,
        airConditions,
        altitude,
        speedM,
        speedV: 0, // TODO: не передавать
      }
    );
    const path = finder.findPath(
      this.initialEntryPoint.x, this.initialEntryPoint.y,
      this.initialExitPoint.x, this.initialExitPoint.y,
      finderGrid,
    );
    const finderArray = finderGrid.toString();

    finderGrid = null;
    finder = null;

    // TODO: temp for debugging
    this.sendResults(path, finderArray);

    return false;
  }

  sendResults(path: ReturnType<CruisePathFinder['findPath']>, finderArray: ReturnType<Grid['toString']>) {
    const finderArrayWithPath = finderArray.map(row => row.map(cell => ({
      ...cell,
      inPath: path.some(c => (c[0] === cell.x && c[1] === cell.y))
    })));

    const result = {
      gridType: 'airConditions',
      finderGrid: finderArrayWithPath,
    };
    this.electronApp.sendToWindow(result);
  }

  createInitialEntryPoint(): void {
    this.initialEntryPoint.x = 0;
    this.initialEntryPoint.y = Math.ceil(this.airConditionsGridSize.height / 2) - 1;
  }

  createInitialExitPoint(): void {
    if (this.geo.distanceInGridCells.x === 0) {
      return;
    }

    const { x: initialX, y: initialY } = this.initialEntryPoint;
    const possibleExitX = initialX + this.geo.distanceInGridCells.x - 1;
    const possibleExitY = initialY + this.geo.distanceInGridCells.y - 1;

    const exitX = Math.max(Math.min(possibleExitX, (this.airConditionsGridSize.width - 1)), 0);
    const exitY = Math.max(Math.min(possibleExitY, (this.airConditionsGridSize.height - 1)), 0);

    this.initialExitPoint = { x: exitX, y: exitY };
  }
};

function convertAirConditionsToWalkableMatrix(conditions: AirConditions): number[][] {
  return conditions.map((row) => {
    return row.map((cell) => (
      typeof cell === 'string' && cell.toLowerCase() === 'x') ? 1 : 0
    );
  });
}

function createMinMaxList(min: number, max: number, increment: number) {
  const list: number[] = [];

  let current = min;

  while (current <= max) {
    list.push(current);
    current += increment;
  }

  return list;
}

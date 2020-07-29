import ElectronApp from './electron/server';
import Grid from './pathfinding/core/grid';
import CruisePathFinder from './pathfinding/finder/cruise-path-finder';
import Geo from './geo';
import { cell } from './constants/grid';
import { fromMilesToGridUnits } from './utils/converters';

import type {
  DisserAppAPI,
  AirConditions,
  CruiseProfile,
  ClimbDescentProfile,
  AltitudeRun,
  SpeedRun,
  TotalRun,
} from './types/interfaces';

const cruiseProfileJSON: CruiseProfile = require('./assets/cruise_profile.json');
const climbProfileJSON: ClimbDescentProfile = require('./assets/climb_profile.json');
const descentProfileJSON: ClimbDescentProfile = require('./assets/descent_profile.json');

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
  private lastUsedEntryPoint = { x: 0, y: 0};
  private lastUsedExitPoint = { x: 0, y: 0};
  private usedPathAngle = 0;
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

  registerAirConditionsForAltitude(conditions: AirConditions|undefined, altitude: number) {
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

    const totalRun: TotalRun = new Map();

    console.time('Speed cycle');
    this.possibleMachList.forEach(speedM => {
      const speedRunSummary = this.performSpeedCycleStep(speedM);
      totalRun.set(speedM, speedRunSummary);
    });
    console.timeEnd('Speed cycle');
  }

  performSpeedCycleStep(speedValue: number): SpeedRun {
    const operatingAlt = this.possibleAltitudeList.filter(alt => (alt >= this.geo.startAltInFeet));
    const climbProfileForCurrentSpeed = getClimbProfileRowsBySpeed(speedValue);
    const descentProfileForCurrentSpeed = getDescentProfileRowsBySpeed(speedValue);

    this.lastUsedEntryPoint = {...this.initialEntryPoint};
    this.lastUsedExitPoint = {...this.initialExitPoint};

    // Структура, в которой хранится проход по всем высотам для текущей скорости в формате «высота : данные»
    const singleSpeedRun: SpeedRun = new Map<number, AltitudeRun>();

    for (let i = 0; i < operatingAlt.length; i++) {
      const currentAlt = operatingAlt[i];
      const prevAlt = i > 0 ? operatingAlt[i - 1] : null;
      const [canContinue, altitudeRunSummary] = this.performAltitudeCycleStep(
        speedValue,
        currentAlt,
        prevAlt,
        climbProfileForCurrentSpeed,
        descentProfileForCurrentSpeed,
      );
      if (altitudeRunSummary) {
        singleSpeedRun.set(currentAlt, altitudeRunSummary);
      }
      if (!canContinue) {
        return singleSpeedRun;
      }
    }

    return singleSpeedRun;
  }

  performAltitudeCycleStep(
    speedM: number,
    altitude: number,
    prevAltitude: number|null,
    climbProfile: ClimbDescentProfile,
    descentProfile: ClimbDescentProfile,
  ): [boolean, AltitudeRun?] {
    const airConditions = this.airConditionsPerAlt[altitude];
    if (airConditions === undefined) {
      throw new Error(`No air conditions added for altitude ${altitude}`);
    }

    let entryPoint = this.lastUsedEntryPoint;
    let exitPoint = this.lastUsedExitPoint;

    let ascentSpecifications = {
      distanceInMiles: 0,
      timeInSeconds: 0,
      fuelBurnInKgs: 0,
    };
    let descentSpecifications = {
      distanceInMiles: 0,
      timeInSeconds: 0,
      fuelBurnInKgs: 0,
    };

    let climbOffsetXInMiles = 0;
    let climbOffsetYInMiles = 0;
    let climbOffsetXInCells = 0;
    let climbOffsetYInCells = 0;

    let descentOffsetXInMiles = 0;
    let descentOffsetYInMiles = 0;
    let descentOffsetXInCells = 0;
    let descentOffsetYInCells = 0;

    if (prevAltitude !== null) {
      try {
        ascentSpecifications = extractAscentSpecifications(speedM, altitude, airConditions, climbProfile, entryPoint);
        climbOffsetXInMiles = Math.cos(this.usedPathAngle) * ascentSpecifications.distanceInMiles;
        climbOffsetYInMiles = Math.sin(this.usedPathAngle) * ascentSpecifications.distanceInMiles;
        climbOffsetXInCells = fromMilesToGridUnits(climbOffsetXInMiles, cell.H_SIZE, 0.52);
        climbOffsetYInCells = fromMilesToGridUnits(climbOffsetYInMiles, cell.V_SIZE, 0.52);
      } catch (e) {
        // TODO: перехватываем ошибку, если с учётом ветра скорость вышла за диапазон, и абортим текущий шаг по высоте
        return [false];
      }

      const nextEntryPoint = {
        x: this.lastUsedEntryPoint.x + climbOffsetXInCells,
        y: this.lastUsedEntryPoint.y + climbOffsetYInCells,
      };

      const forbiddenAreasDuringClimb = checkPrevAltitudeForbiddenAreas(
        entryPoint,
        nextEntryPoint,
        this.airConditionsPerAlt[prevAltitude],
      );

      if (forbiddenAreasDuringClimb) {
        return [false];
      }

      entryPoint = nextEntryPoint;

      try {
        descentSpecifications = extractDescentSpecifications(
          speedM,
          prevAltitude,
          this.airConditionsPerAlt[prevAltitude],
          descentProfile,
          exitPoint,
        );
        descentOffsetXInMiles = Math.cos(this.usedPathAngle) * descentSpecifications.distanceInMiles;
        descentOffsetYInMiles = Math.sin(this.usedPathAngle) * descentSpecifications.distanceInMiles;
        descentOffsetXInCells = fromMilesToGridUnits(descentOffsetXInMiles, cell.H_SIZE, 0.52);
        descentOffsetYInCells = fromMilesToGridUnits(descentOffsetYInMiles, cell.V_SIZE, 0.52);
      } catch (e) {
        // TODO: перехватываем ошибку, если с учётом ветра скорость вышла за диапазон, и абортим текущий шаг по высоте
        return [false];
      }

      const nextExitPoint = {
        x: this.lastUsedExitPoint.x - descentOffsetXInCells,
        y: this.lastUsedExitPoint.y - descentOffsetYInCells,
      };

      const forbiddenAreasDuringDescent = checkPrevAltitudeForbiddenAreas(
        nextExitPoint,
        exitPoint,
        this.airConditionsPerAlt[altitude],
      );

      if (forbiddenAreasDuringDescent) {
        return [false];
      }

      exitPoint = nextExitPoint;
    }

    if (entryPoint.x >= exitPoint.x || entryPoint.y >= exitPoint.y) {
      // так долго взлетали, что попали сразу на выход, и на крейсере лететь некуда
      return [
        false,
        {
          ascent: {
            distanceInMiles: ascentSpecifications.distanceInMiles,
            fuelBurnInKgs: ascentSpecifications.fuelBurnInKgs,
            timeInHours: ascentSpecifications.timeInSeconds / 3600,
          },
          descent: {
            distanceInMiles: descentSpecifications.distanceInMiles,
            fuelBurnInKgs: descentSpecifications.fuelBurnInKgs,
            timeInHours: descentSpecifications.timeInSeconds / 3600,
          },
          cruise: {
            path: [],
            distanceInMiles: 0,
            fuelBurnInKgs: 0,
            timeInHours: 0,
          }
        },
      ]
    }

    let finderGrid: Grid|null = new Grid(convertAirConditionsToWalkableMatrix(airConditions));
    finderGrid.setCellSize({ x: cell.H_SIZE, y: cell.V_SIZE });

    let finder: CruisePathFinder|null = new CruisePathFinder(
      { allowDiagonal: true },
      {
        profile: cruiseProfileJSON,
        airConditions,
        altitude,
        speedM,
        speedV: 0, // TODO: не передавать
      }
    );
    const { path, summary } = finder.findPathWithSummary(
      entryPoint.x, entryPoint.y,
      exitPoint.x, exitPoint.y,
      finderGrid,
    );
    const altitudeRun: AltitudeRun = {
      ascent: {
        distanceInMiles: ascentSpecifications.distanceInMiles,
        fuelBurnInKgs: ascentSpecifications.fuelBurnInKgs,
        timeInHours: ascentSpecifications.timeInSeconds / 3600,
      },
      descent: {
        distanceInMiles: descentSpecifications.distanceInMiles,
        fuelBurnInKgs: descentSpecifications.fuelBurnInKgs,
        timeInHours: descentSpecifications.timeInSeconds / 3600,
      },
      cruise: {
        path,
        distanceInMiles: summary.totalDistance,
        fuelBurnInKgs: summary.totalFuelBurn,
        timeInHours: summary.totalTime,
      }
    };

    this.lastUsedEntryPoint = entryPoint;
    this.lastUsedExitPoint = exitPoint;
    finderGrid = null;
    finder = null;

    // // TODO: temp for debugging
    // this.sendResults(path, finderArray);

    return [true, altitudeRun];
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

    const xDistance = Math.abs(this.initialExitPoint.x - this.initialEntryPoint.x);
    const yDistance = Math.abs(this.initialExitPoint.y - this.initialEntryPoint.y);
    const diagonal = Math.hypot(xDistance, yDistance);

    // TODO: этот расчёт путевого угла нужен из-за того, что тестовый airConditions меньше области по gps-координатам
    const pathAngle = Math.acos(xDistance / diagonal);
    this.usedPathAngle = pathAngle;
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

function extractAscentSpecifications(
  speedM: number,
  altitude: number,
  airConditions: AirConditions,
  climbProfileForAirSpeed: ClimbDescentProfile,
  currentPoint: { x: number, y: number },
): { distanceInMiles: number, timeInSeconds: number, fuelBurnInKgs: number } {
  const windAtPoint = airConditions[currentPoint.y][currentPoint.x] as number;

  const climbRowForAltitude = climbProfileForAirSpeed.find(row => (row.altitude === altitude));

  if (!climbRowForAltitude) {
    throw new Error(`No climb profile for Mach ${speedM} and altitude ${altitude}`);
  }

  const speedV = climbRowForAltitude.speedV;
  const groundSpeed = speedV + windAtPoint;
  const speedOfSound = climbRowForAltitude.speedOfSound;
  const gsMach = groundSpeed / speedOfSound;
  const recalculatedMach = Number(gsMach.toPrecision(2));

  const climbProfileForGroundSpeed = getClimbProfileRowsBySpeed(recalculatedMach);
  const finalClimbRow = climbProfileForGroundSpeed.find(row => (row.altitude === altitude));

  if (!finalClimbRow) {
    // TODO: что если с учётом ветра М будет больше MAX_M или меньше MIN_M ?
    throw new Error(`No climb profile for Mach ${recalculatedMach} and altitude ${altitude}`);
  }

  // Особенность: наличие ветра не переводит двигатели в другой режим.
  // Поэтому расход топлива берём от целевой скорости, а не от скорости с учётом ветра (он должен быть одинаковым)
  return {
    distanceInMiles: finalClimbRow.distanceFromPrev,
    timeInSeconds: finalClimbRow.time,
    fuelBurnInKgs: climbRowForAltitude.fuelFromPrev,
  };
}

function extractDescentSpecifications(
  speedM: number,
  altitude: number,
  airConditions: AirConditions,
  descentProfileForAirSpeed: ClimbDescentProfile,
  currentPoint: { x: number, y: number },
): { distanceInMiles: number, timeInSeconds: number, fuelBurnInKgs: number } {
  const windAtPoint = airConditions[currentPoint.y][currentPoint.x] as number;

  const descentRowForAltitude = descentProfileForAirSpeed.find(row => (row.altitude === altitude));

  if (!descentRowForAltitude) {
    throw new Error(`No descent profile for Mach ${speedM} and altitude ${altitude}`);
  }

  const speedV = descentRowForAltitude.speedV;
  const groundSpeed = speedV + windAtPoint;
  const speedOfSound = descentRowForAltitude.speedOfSound;
  const gsMach = groundSpeed / speedOfSound;
  const recalculatedMach = Number(gsMach.toPrecision(2));

  const descentProfileForGroundSpeed = getDescentProfileRowsBySpeed(recalculatedMach);
  const finalDescentRow = descentProfileForGroundSpeed.find(row => (row.altitude === altitude));

  if (!finalDescentRow) {
    // TODO: что если с учётом ветра М будет больше MAX_M или меньше MIN_M ?
    throw new Error(`No descent profile for Mach ${recalculatedMach} and altitude ${altitude}`);
  }

  // Особенность: наличие ветра не переводит двигатели в другой режим.
  // Поэтому расход топлива берём от целевой скорости, а не от скорости с учётом ветра (он должен быть одинаковым)
  return {
    distanceInMiles: finalDescentRow.distanceFromPrev,
    timeInSeconds: finalDescentRow.time,
    fuelBurnInKgs: descentRowForAltitude.fuelFromPrev,
  };
}

function getClimbProfileRowsBySpeed(speedM: number): ClimbDescentProfile {
  return climbProfileJSON.filter(row => (row.speedM === speedM));
}

function getDescentProfileRowsBySpeed(speedM: number): ClimbDescentProfile {
  return descentProfileJSON.filter(row => (row.speedM === speedM));
}

function checkPrevAltitudeForbiddenAreas(
  startPoint: { x: number, y: number },
  endPoint: { x: number, y: number },
  currentAirConditions: AirConditions,
): boolean {
  let hasForbiddenCell = false;

  for (let y = startPoint.y; y < endPoint.y; y++) {
    for (let x = startPoint.x; x < endPoint.x; x++) {
      const conditionAtPoint = currentAirConditions[y][x];
      if (typeof conditionAtPoint === 'string' && conditionAtPoint.toLowerCase() === 'x') {
        hasForbiddenCell = true;
        return true;
      }
    }
  }

  return false;
}

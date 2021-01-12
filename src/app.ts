import ElectronApp from './electron/server';
import Grid from './pathfinding/core/grid';
import CruisePathFinder from './pathfinding/finder/cruise-path-finder';
import OptimalPathFinder from './pathfinding/finder/optimal-path-finder';
import Geo from './geo';
import { cell } from './constants/grid';
import { fromMilesToGridUnits } from './utils/converters';
import { convertPathToGeodeticCoords, convertZoneToCoords } from './utils/geo/path-to-coords';
import { getClimbProfileRowsBySpeed, getDescentProfileRowsBySpeed } from './flight-profiles';

import type {
  DisserAppAPI,
  AirConditions,
  ClimbDescentProfile,
  AltitudeRun,
  SpeedRun,
  TotalRun,
  OptimalPathWithCoords, OptimalPath,
  RtaOptimalPathWithCoords,
} from './types/interfaces';

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
  private readonly optimalPathFinder: OptimalPathFinder = new OptimalPathFinder();

  private airConditionsPerAlt: Record<number, AirConditions> = {};
  private airConditionsGridSize = { width: 0, height: 0 };
  private initialEntryPoint = { x: 0, y: 0};
  private initialExitPoint = { x: 0, y: 0};
  private lastUsedEntryPoint = { x: 0, y: 0};
  private lastUsedExitPoint = { x: 0, y: 0};
  private usedPathAngle = 0;
  private customCostIndex = 0;
  private readonly possibleAltitudeList: number[] = [];
  private readonly possibleMachList: number[] = [];

  private totalRun: TotalRun = new Map();

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

    this.createInitialEntryPoint(geoConditions);
    this.createInitialExitPoint();

    this.customCostIndex = parseInt(geoConditions['cost-index'], 10);
  }

  applyArrivalTime(arrivalTime: string) {
    this.geo.applyArrivalDate(arrivalTime);
    this.optimalPathFinder.findRTAOptimalPath(this.geo.departureDate, this.geo.arrivalDate, this.totalRun);
    const rtaPath = this.optimalPathFinder.rtaOptimalPath;
    if (rtaPath === null) {
      return;
    }
    const rtaPathCoords = convertPathToGeodeticCoords(
      rtaPath.path,
      rtaPath.altitude,
      this.initialEntryPoint,
      this.geo.startLBHCoords,
      this.geo.finalLBHCoords,
    );
    const rtaForbiddenZone = convertZoneToCoords(
      this.airConditionsPerAlt[rtaPath.altitude],
      rtaPath.altitude,
      this.initialEntryPoint,
      this.geo.startLBHCoords,
      this.geo.finalLBHCoords,
    );
    const rtaOptimalPathWithCoords: RtaOptimalPathWithCoords = {
      ...rtaPath,
      coords: rtaPathCoords,
      zone: rtaForbiddenZone,
    };
    this.electronApp.renderRTAPath(rtaOptimalPathWithCoords);
  }

  startFinder() {
    if (!this.geo.isCoordsLoaded()) {
      throw new Error('No coords for start and dest points');
    }

    if (Object.keys(this.airConditionsPerAlt).length === 0) {
      throw new Error('No air conditions loaded at all, please provide one');
    }

    if (this.totalRun.size !== 0) {
      this.totalRun = new Map<number, SpeedRun>();
    }

    const startTimestamp = Date.now();

    this.possibleMachList.forEach(speedM => {
      const speedRunSummary = this.performSpeedCycleStep(speedM);
      this.totalRun.set(speedM, speedRunSummary);
    });

    const { optimal, full } = this.findBasicOptimalPaths(this.totalRun);

    this.electronApp.sendInitialPoints({ entry: this.initialEntryPoint, exit: this.initialExitPoint })
    this.electronApp.renderTotalRun({ totalRun: this.totalRun, flightCost: full });
    this.electronApp.renderOptimalPaths(optimal);

    const endTimestamp = Date.now();
    const calculationTimeInMs = endTimestamp - startTimestamp;
    this.electronApp.sendCalculationTime(calculationTimeInMs);

    const possibleArrivalTime = this.optimalPathFinder.getPossibleArrivalTime(this.geo.departureDate);
    this.electronApp.requestArrivalTime(possibleArrivalTime);
  }

  performSpeedCycleStep(speedValue: number): SpeedRun {
    const upperOperatingAlt = this.possibleAltitudeList.filter(alt => (alt >= this.geo.startAltInFeet));
    const lowerOperatingAlt = this.possibleAltitudeList.filter(alt => (alt <= this.geo.startAltInFeet)).reverse();
    const climbProfileForCurrentSpeed = getClimbProfileRowsBySpeed(speedValue);
    const descentProfileForCurrentSpeed = getDescentProfileRowsBySpeed(speedValue);

    // Структура, в которой хранится проход по всем высотам для текущей скорости в формате «высота : данные»
    const singleSpeedRun: SpeedRun = new Map<number, AltitudeRun>();

    this.lastUsedEntryPoint = {...this.initialEntryPoint};
    this.lastUsedExitPoint = {...this.initialExitPoint};

    for (let i = 0; i < upperOperatingAlt.length; i++) {
      const currentAlt = upperOperatingAlt[i];
      const prevAlt = i > 0 ? upperOperatingAlt[i - 1] : null;
      const [canContinue, altitudeRunSummary] = this.performAltitudeCycleStep(
        speedValue,
        currentAlt,
        prevAlt,
        climbProfileForCurrentSpeed,
        descentProfileForCurrentSpeed,
      );
      if (altitudeRunSummary) {
        const prevSummary = prevAlt ? singleSpeedRun.get(prevAlt) : undefined;
        const currentAltitudeRunSummary: AltitudeRun = combineWithPrev(altitudeRunSummary, prevSummary);
        singleSpeedRun.set(currentAlt, currentAltitudeRunSummary);
      }
      if (!canContinue) {
        break;
      }
    }

    this.lastUsedEntryPoint = {...this.initialEntryPoint};
    this.lastUsedExitPoint = {...this.initialExitPoint};

    for (let i = 0; i < lowerOperatingAlt.length; i++) {
      const currentAlt = lowerOperatingAlt[i];
      const prevAlt = i > 0 ? lowerOperatingAlt[i - 1] : null;
      const [canContinue, altitudeRunSummary] = this.performAltitudeCycleStep(
        speedValue,
        currentAlt,
        prevAlt,
        climbProfileForCurrentSpeed,
        descentProfileForCurrentSpeed,
      );
      if (altitudeRunSummary) {
        const prevSummary = prevAlt ? singleSpeedRun.get(prevAlt) : undefined;
        const currentAltitudeRunSummary: AltitudeRun = combineWithPrev(altitudeRunSummary, prevSummary);
        singleSpeedRun.set(currentAlt, currentAltitudeRunSummary);
      }
      if (!canContinue) {
        break;
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

    let ascentSpecifications: AltitudeRun['ascent'] = {
      distanceInMiles: 0,
      timeInHours: 0,
      fuelBurnInKgs: 0,
      averageWind: 0,
    };
    let descentSpecifications: AltitudeRun['descent'] = {
      distanceInMiles: 0,
      timeInHours: 0,
      fuelBurnInKgs: 0,
      averageWind: 0,
    };

    if (prevAltitude !== null) {
      const prevAltAirConditions = this.airConditionsPerAlt[prevAltitude];
      let nextEntryPoint = { ...entryPoint };
      let nextExitPoint = { ...exitPoint };

      try {
        const res = this.getNextEntryPoint(
          speedM, entryPoint, exitPoint,
          altitude, airConditions, climbProfile,
          prevAltitude, prevAltAirConditions, descentProfile,
        );

        nextEntryPoint = res.nextEntryPoint;
        if (res.ascentSpec) {
          ascentSpecifications = res.ascentSpec;
        }

        if (res.descentSpec) {
          descentSpecifications = res.descentSpec;
        }
      } catch (e) {
        // TODO: перехватываем ошибку, если с учётом ветра скорость вышла за диапазон, и абортим текущий шаг по высоте
        return [false];
      }

      const forbiddenAreasDuringClimb = checkPrevAltitudeForbiddenAreas(
        entryPoint,
        nextEntryPoint,
        prevAltAirConditions,
      );

      if (forbiddenAreasDuringClimb) {
        return [false];
      }

      entryPoint = nextEntryPoint;

      try {
        const res = this.getNextExitPoint(
          speedM, entryPoint, exitPoint,
          altitude, airConditions, climbProfile,
          prevAltitude, prevAltAirConditions, descentProfile,
        );

        nextExitPoint = res.nextExitPoint;
        if (res.ascentSpec) {
          ascentSpecifications = res.ascentSpec;
        }

        if (res.descentSpec) {
          descentSpecifications = res.descentSpec;
        }
      } catch (e) {
        // TODO: перехватываем ошибку, если с учётом ветра скорость вышла за диапазон, и абортим текущий шаг по высоте
        return [false];
      }

      const forbiddenAreasDuringDescent = checkPrevAltitudeForbiddenAreas(
        nextExitPoint,
        exitPoint,
        airConditions,
      );

      if (forbiddenAreasDuringDescent) {
        return [false];
      }

      exitPoint = nextExitPoint;
    }

    if (entryPoint.x >= exitPoint.x && entryPoint.y >= exitPoint.y) {
      // так долго взлетали, что попали сразу на выход, и на крейсере лететь некуда
      return [
        false,
        {
          ascent: {
            distanceInMiles: ascentSpecifications.distanceInMiles,
            fuelBurnInKgs: ascentSpecifications.fuelBurnInKgs,
            timeInHours: ascentSpecifications.timeInHours,
            averageWind: ascentSpecifications.averageWind
          },
          descent: {
            distanceInMiles: descentSpecifications.distanceInMiles,
            fuelBurnInKgs: descentSpecifications.fuelBurnInKgs,
            timeInHours: descentSpecifications.timeInHours,
            averageWind: descentSpecifications.averageWind
          },
          cruise: {
            path: [],
            distanceInMiles: 0,
            fuelBurnInKgs: 0,
            timeInHours: 0,
            averageWind: 0,
          }
        },
      ]
    }

    let finderGrid: Grid|null = new Grid(convertAirConditionsToWalkableMatrix(airConditions));
    finderGrid.setCellSize({ x: cell.H_SIZE, y: cell.V_SIZE });

    let finder: CruisePathFinder|null = new CruisePathFinder(
      { allowDiagonal: true },
      {
        airConditions,
        altitude,
        speedM,
        speedV: 0, // TODO: не передавать
      }
    );
    const routeIsPossible = finder.checkIfRoutePossible();

    if (!routeIsPossible) {
      return [false];
    }

    const { path, summary } = finder.findPathWithSummary(
      entryPoint.x, entryPoint.y,
      exitPoint.x, exitPoint.y,
      finderGrid,
    );
    const altitudeRun: AltitudeRun = {
      ascent: {
        distanceInMiles: ascentSpecifications.distanceInMiles,
        fuelBurnInKgs: ascentSpecifications.fuelBurnInKgs,
        timeInHours: ascentSpecifications.timeInHours,
        averageWind: ascentSpecifications.averageWind
      },
      descent: {
        distanceInMiles: descentSpecifications.distanceInMiles,
        fuelBurnInKgs: descentSpecifications.fuelBurnInKgs,
        timeInHours: descentSpecifications.timeInHours,
        averageWind: descentSpecifications.averageWind
      },
      cruise: {
        path,
        distanceInMiles: summary.totalDistance,
        fuelBurnInKgs: summary.totalFuelBurn,
        timeInHours: summary.totalTime,
        averageWind: summary.averageWind,
      }
    };

    this.lastUsedEntryPoint = entryPoint;
    this.lastUsedExitPoint = exitPoint;
    finderGrid = null;
    finder = null;

    return [true, altitudeRun];
  }

  createInitialEntryPoint(geoConditions?: Record<string, string>): void {
    const defaultEntryX = 0;
    const defaultEntryY = 0;
    if (geoConditions) {
      this.initialEntryPoint.x = geoConditions['initial-x'] !== undefined
        ? parseInt(geoConditions['initial-x'])
        : defaultEntryX;
      this.initialEntryPoint.y = geoConditions['initial-y'] !== undefined
        ? parseInt(geoConditions['initial-y'])
        : defaultEntryY;
      return;
    }
    this.initialEntryPoint.x = this.initialEntryPoint.x || defaultEntryX;
    this.initialEntryPoint.y = this.initialEntryPoint.y || defaultEntryY;
  }

  createInitialExitPoint(): void {
    if (this.geo.distanceInGridCells.x === 0 && this.geo.distanceInGridCells.y === 0) {
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

  findBasicOptimalPaths(totalRun: TotalRun): {
    optimal: { fuel: OptimalPathWithCoords, time: OptimalPathWithCoords, combined: OptimalPathWithCoords },
    full: { fuel: number[][], time: number[][], combined: number[][] }
  } {
    this.optimalPathFinder.setCustomCostIndex(this.customCostIndex);
    this.optimalPathFinder.setStartAlt(this.geo.startAltInFeet);
    const { optimal, full } =  this.optimalPathFinder.findBasicOptimalPaths(totalRun);

    const optimalWithCoords = this.injectOptimalPathCoords(optimal);

    return {
      full,
      optimal: optimalWithCoords,
    };
  }

  injectOptimalPathCoords(
    optimal: { fuel: OptimalPath, time: OptimalPath, combined: OptimalPath }
  ): { fuel: OptimalPathWithCoords, time: OptimalPathWithCoords, combined: OptimalPathWithCoords } {
    const fuelCruiseCoords = convertPathToGeodeticCoords(
      optimal.fuel.path,
      optimal.fuel.altitude,
      this.initialEntryPoint,
      this.geo.startLBHCoords,
      this.geo.finalLBHCoords,
    );
    const fuelAltitudeForbiddenZone = convertZoneToCoords(
      this.airConditionsPerAlt[optimal.fuel.altitude],
      optimal.fuel.altitude,
      this.initialEntryPoint,
      this.geo.startLBHCoords,
      this.geo.finalLBHCoords,
    );
    const timeCruiseCoords = convertPathToGeodeticCoords(
      optimal.time.path,
      optimal.time.altitude,
      this.initialEntryPoint,
      this.geo.startLBHCoords,
      this.geo.finalLBHCoords,
    );
    const timeAltitudeForbiddenZone = convertZoneToCoords(
      this.airConditionsPerAlt[optimal.time.altitude],
      optimal.time.altitude,
      this.initialEntryPoint,
      this.geo.startLBHCoords,
      this.geo.finalLBHCoords,
    );
    const combinedCruiseCoords = convertPathToGeodeticCoords(
      optimal.combined.path,
      optimal.combined.altitude,
      this.initialEntryPoint,
      this.geo.startLBHCoords,
      this.geo.finalLBHCoords,
    );
    const combinedAltitudeForbiddenZone = convertZoneToCoords(
      this.airConditionsPerAlt[optimal.combined.altitude],
      optimal.combined.altitude,
      this.initialEntryPoint,
      this.geo.startLBHCoords,
      this.geo.finalLBHCoords,
    );
    return {
      fuel: { ...optimal.fuel, coords: fuelCruiseCoords, zone: fuelAltitudeForbiddenZone },
      time: { ...optimal.time, coords: timeCruiseCoords, zone: timeAltitudeForbiddenZone },
      combined: { ...optimal.combined, coords: combinedCruiseCoords, zone: combinedAltitudeForbiddenZone },
    };
  }

  getNextEntryPoint(
    speedM: number,
    prevEntryPoint: { x: number, y: number }, prevExitPoint: { x: number, y: number },
    altitude: number, airConditions: AirConditions, climbProfile: ClimbDescentProfile,
    prevAltitude: number, prevAltAirConditions: AirConditions, descentProfile: ClimbDescentProfile,
  ): { nextEntryPoint: { x: number, y: number }, ascentSpec?: AltitudeRun['ascent'], descentSpec?: AltitudeRun['descent'] } {
    // от стартовой высоты идём вниз, а не вверх, поэтому сначала снижение, а потом набор
    const isGettingLow = altitude < prevAltitude;

    if (isGettingLow) {
      const descentSpecifications = extractDescentSpecifications(
        speedM, altitude, prevAltAirConditions, descentProfile, prevEntryPoint,
      );

      if (!descentSpecifications.distanceInMiles) {
        throw new Error(`Cannot descent to alt ${altitude} at speed ${speedM}`);
      }

      const descentOffsetXInMiles = Math.cos(this.usedPathAngle) * descentSpecifications.distanceInMiles;
      const descentOffsetYInMiles = Math.sin(this.usedPathAngle) * descentSpecifications.distanceInMiles;
      const descentOffsetXInCells = fromMilesToGridUnits(descentOffsetXInMiles, cell.H_SIZE, 0.52);
      const descentOffsetYInCells = fromMilesToGridUnits(descentOffsetYInMiles, cell.V_SIZE, 0.52);

      const nextEntryPoint = {
        x: prevEntryPoint.x + descentOffsetXInCells,
        y: prevEntryPoint.y + descentOffsetYInCells,
      };

      descentSpecifications.averageWind = (getWindAtPoint(prevEntryPoint, prevAltAirConditions) + getWindAtPoint(nextEntryPoint, airConditions)) / 2;

      return {
        nextEntryPoint,
        descentSpec: descentSpecifications,
      };
    }

    const ascentSpecifications = extractAscentSpecifications(
      speedM, altitude, prevAltAirConditions, climbProfile, prevEntryPoint
    );

    if (!ascentSpecifications.distanceInMiles) {
      throw new Error(`Cannot climb to alt ${altitude} at speed ${speedM}`);
    }

    const climbOffsetXInMiles = Math.cos(this.usedPathAngle) * ascentSpecifications.distanceInMiles;
    const climbOffsetYInMiles = Math.sin(this.usedPathAngle) * ascentSpecifications.distanceInMiles;
    const climbOffsetXInCells = fromMilesToGridUnits(climbOffsetXInMiles, cell.H_SIZE, 0.52);
    const climbOffsetYInCells = fromMilesToGridUnits(climbOffsetYInMiles, cell.V_SIZE, 0.52);
    const nextEntryPoint = {
      x: prevEntryPoint.x + climbOffsetXInCells,
      y: prevEntryPoint.y + climbOffsetYInCells,
    };

    ascentSpecifications.averageWind = (getWindAtPoint(prevEntryPoint, prevAltAirConditions) + getWindAtPoint(nextEntryPoint, airConditions)) / 2;

    return {
      nextEntryPoint,
      ascentSpec: ascentSpecifications,
    };
  }

  getNextExitPoint(
    speedM: number,
    prevEntryPoint: { x: number, y: number }, prevExitPoint: { x: number, y: number },
    altitude: number, airConditions: AirConditions, climbProfile: ClimbDescentProfile,
    prevAltitude: number, prevAltAirConditions: AirConditions, descentProfile: ClimbDescentProfile,
  ): { nextExitPoint: { x: number, y: number }, ascentSpec?: AltitudeRun['ascent'], descentSpec?: AltitudeRun['descent'] } {
    // от стартовой высоты идём вниз, а не вверх, поэтому сначала снижение, а потом набор
    const isGettingLow = altitude < prevAltitude;

    if (isGettingLow) {
      const ascentSpecifications = extractAscentSpecifications(
        speedM, prevAltitude, prevAltAirConditions, climbProfile, prevExitPoint
      );

      if (!ascentSpecifications.distanceInMiles) {
        throw new Error(`Cannot climb to alt ${altitude} at speed ${speedM}`);
      }

      const climbOffsetXInMiles = Math.cos(this.usedPathAngle) * ascentSpecifications.distanceInMiles;
      const climbOffsetYInMiles = Math.sin(this.usedPathAngle) * ascentSpecifications.distanceInMiles;
      const climbOffsetXInCells = fromMilesToGridUnits(climbOffsetXInMiles, cell.H_SIZE, 0.52);
      const climbOffsetYInCells = fromMilesToGridUnits(climbOffsetYInMiles, cell.V_SIZE, 0.52);

      const nextExitPoint = {
        x: prevExitPoint.x - climbOffsetXInCells,
        y: prevExitPoint.y - climbOffsetYInCells,
      };

      ascentSpecifications.averageWind = (getWindAtPoint(prevExitPoint, prevAltAirConditions) + getWindAtPoint(nextExitPoint, airConditions)) / 2;

      return {
        nextExitPoint,
        ascentSpec: ascentSpecifications,
      };
    }

    const descentSpecifications = extractDescentSpecifications(
      speedM, prevAltitude, prevAltAirConditions, descentProfile, prevExitPoint,
    );

    if (!descentSpecifications.distanceInMiles) {
      throw new Error(`Cannot descent to alt ${altitude} at speed ${speedM}`);
    }

    const descentOffsetXInMiles = Math.cos(this.usedPathAngle) * descentSpecifications.distanceInMiles;
    const descentOffsetYInMiles = Math.sin(this.usedPathAngle) * descentSpecifications.distanceInMiles;
    const descentOffsetXInCells = fromMilesToGridUnits(descentOffsetXInMiles, cell.H_SIZE, 0.52);
    const descentOffsetYInCells = fromMilesToGridUnits(descentOffsetYInMiles, cell.V_SIZE, 0.52);
    const nextExitPoint = {
      x: prevExitPoint.x - descentOffsetXInCells,
      y: prevExitPoint.y - descentOffsetYInCells,
    };

    descentSpecifications.averageWind = (getWindAtPoint(prevExitPoint, prevAltAirConditions) + getWindAtPoint(nextExitPoint, airConditions)) / 2;

    return {
      nextExitPoint,
      descentSpec: descentSpecifications,
    };
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
): AltitudeRun['ascent'] {
  const windAtPoint = getWindAtPoint(currentPoint, airConditions);

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
    timeInHours: finalClimbRow.time / 3600,
    fuelBurnInKgs: climbRowForAltitude.fuelFromPrev,
    averageWind: windAtPoint,
  };
}

function extractDescentSpecifications(
  speedM: number,
  altitude: number,
  airConditions: AirConditions,
  descentProfileForAirSpeed: ClimbDescentProfile,
  currentPoint: { x: number, y: number },
): AltitudeRun['descent'] {
  const windAtPoint = getWindAtPoint(currentPoint, airConditions);

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
    timeInHours: finalDescentRow.time / 3600,
    fuelBurnInKgs: descentRowForAltitude.fuelFromPrev,
    averageWind: windAtPoint,
  };
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

function combineWithPrev(currentSummary: AltitudeRun, prevSummary: AltitudeRun|undefined): AltitudeRun {
  if (!prevSummary) {
    return currentSummary;
  }

  return {
    cruise: currentSummary.cruise,
    ascent: {
      distanceInMiles: currentSummary.ascent.distanceInMiles + prevSummary.ascent.distanceInMiles,
      fuelBurnInKgs: currentSummary.ascent.fuelBurnInKgs + prevSummary.ascent.fuelBurnInKgs,
      timeInHours: currentSummary.ascent.timeInHours + prevSummary.ascent.timeInHours,
      averageWind: (
        prevSummary.ascent.averageWind > 0
          ? (currentSummary.ascent.averageWind + prevSummary.ascent.averageWind) / 2
          : currentSummary.ascent.averageWind
      ),
    },
    descent: {
      distanceInMiles: currentSummary.descent.distanceInMiles + prevSummary.descent.distanceInMiles,
      fuelBurnInKgs: currentSummary.descent.fuelBurnInKgs + prevSummary.descent.fuelBurnInKgs,
      timeInHours: currentSummary.descent.timeInHours + prevSummary.descent.timeInHours,
      averageWind: (
        prevSummary.descent.averageWind > 0
          ? (currentSummary.descent.averageWind + prevSummary.descent.averageWind) / 2
          : currentSummary.descent.averageWind
      ),
    },
  };
}

function getWindAtPoint(point: { x: number, y: number }, airConditions: AirConditions): number {
  return (airConditions[point.y][point.x] as number);
}

import { getCruiseProfileRowsByAltitude } from '../../flight-profiles';
import settings from '../../app.settings';

import type { TotalRun, AltitudeRun, OptimalPath } from '../../types/interfaces';

const costFactor = {
  fuel: {
    Cf: 1,
    CI: 0,
  },
  time: {
    Cf: 1,
    CI: 99,
  },
  custom: {
    Cf: 1,
    CI: 50,
  },
};

const emptyOptimalPath: OptimalPath = {
  flightCost: 0,
  fuel: 0,
  time: 0,
  distance: 0,
  speed: 0,
  altitude: 0,
  path: [],
  averageWind: 0,
};

// TODO: брать из приложения
const minMach = 0.71;
const maxMach = 0.81;

export default class OptimalPathFinder {
  fuelOptimalPath: OptimalPath|null = null;
  timeOptimalPath: OptimalPath|null = null;
  combinedOptimalPath: OptimalPath|null = null;
  rtaOptimalPath: OptimalPath|null = null;

  costFactor = costFactor;
  availableTimeInHours = 0;

  constructor(private totalRun: TotalRun) {}

  findBasicOptimalPaths(): void {
    let minimumFuelFlightCost = Number.MAX_SAFE_INTEGER;
    let minimumTimeFlightCost = Number.MAX_SAFE_INTEGER;
    let minimumCombinedFlightCost = Number.MAX_SAFE_INTEGER;
    let fuelOptimalPath: OptimalPath = emptyOptimalPath;
    let timeOptimalPath: OptimalPath = emptyOptimalPath;
    let combinedOptimalPath: OptimalPath = emptyOptimalPath;

    const flightCostLog: {
      fuel: [number, number, number][],
      time: [number, number, number][],
      combined: [number, number, number][],
    } = {
      fuel: [],
      time: [],
      combined: [],
    };

    for (const [speed, speedSummary] of this.totalRun) {
      for (const [altitude, altSummary] of speedSummary) {
        const fuelConsumption = summarize(altSummary, 'fuelBurnInKgs');
        const timeSpent = summarize(altSummary, 'timeInHours');
        const flightDistance = summarize(altSummary, 'distanceInMiles');
        const fuelFlightCost = getFlightCost(fuelConsumption, timeSpent, costFactor.fuel);
        const timeFlightCost = getFlightCost(fuelConsumption, timeSpent, costFactor.time);
        const combinedFlightCost = getFlightCost(fuelConsumption, timeSpent, costFactor.custom);

        flightCostLog.fuel.push([speed, altitude, fuelFlightCost]);
        flightCostLog.time.push([speed, altitude, timeFlightCost]);
        flightCostLog.combined.push([speed, altitude, combinedFlightCost]);

        if (fuelFlightCost < minimumFuelFlightCost) {
          minimumFuelFlightCost = fuelFlightCost;
          fuelOptimalPath = {
            flightCost: fuelFlightCost,
            fuel: fuelConsumption,
            time: timeSpent,
            distance: flightDistance,
            speed,
            altitude,
            path: altSummary.cruise.path,
            averageWind: (
              altSummary.ascent.averageWind + altSummary.cruise.averageWind + altSummary.descent.averageWind
            ) / 3,
          };
        }

        if (timeFlightCost < minimumTimeFlightCost) {
          minimumTimeFlightCost = timeFlightCost;
          timeOptimalPath = {
            flightCost: timeFlightCost,
            fuel: fuelConsumption,
            time: timeSpent,
            distance: flightDistance,
            speed,
            altitude,
            path: altSummary.cruise.path,
            averageWind: (
              altSummary.ascent.averageWind + altSummary.cruise.averageWind + altSummary.descent.averageWind
            ) / 3,
          }
        }

        if (combinedFlightCost < minimumCombinedFlightCost) {
          minimumCombinedFlightCost = combinedFlightCost;
          combinedOptimalPath = {
            flightCost: combinedFlightCost,
            fuel: fuelConsumption,
            time: timeSpent,
            distance: flightDistance,
            speed,
            altitude,
            path: altSummary.cruise.path,
            averageWind: (
              altSummary.ascent.averageWind + altSummary.cruise.averageWind + altSummary.descent.averageWind
            ) / 3,
          }
        }
      }
    }

    flightCostLog.fuel = flightCostLog.fuel.sort(compareFn);
    flightCostLog.time = flightCostLog.time.sort(compareFn);
    flightCostLog.combined = flightCostLog.combined.sort(compareFn);

    this.fuelOptimalPath = fuelOptimalPath;
    this.timeOptimalPath = timeOptimalPath;
    this.combinedOptimalPath = combinedOptimalPath;
  }

  calculateTimeArrivalConstraints(fuelOptimalPath: OptimalPath): { min: number, max: number } {
    const profileRowForAltitude = getCruiseProfileRowsByAltitude(fuelOptimalPath.altitude);
    const speedOfSound = profileRowForAltitude[0].speedOfSound;

    const minimumAirSpeed = settings.environment.minM * speedOfSound; // knots
    const maximumAirSpeed = settings.environment.maxM * speedOfSound; // knots

    const minGroundSpeed = minimumAirSpeed + fuelOptimalPath.averageWind;
    const maxGroundSpeed = maximumAirSpeed + fuelOptimalPath.averageWind;

    const maxFlightTime = fuelOptimalPath.distance / minGroundSpeed; // hours
    const minFlightTime = fuelOptimalPath.distance / maxGroundSpeed;
    return {
      min: minFlightTime,
      max: maxFlightTime,
    };
  }

  findRTAOptimalPath(fuelOptimalPath: OptimalPath, arrivalTimeConstraints: { min: number, max: number }): OptimalPath|null {
    if (
      this.availableTimeInHours < arrivalTimeConstraints.min
      || this.availableTimeInHours > arrivalTimeConstraints.max
    ) {
      const err = `Unsupported arrival time.
Min time: ${arrivalTimeConstraints.min} hours, max time: ${arrivalTimeConstraints.max} hours.
Selected time: ${this.availableTimeInHours} hours.`;
      throw new Error(err);
    }

    const requiredGroundSpeed = fuelOptimalPath.distance / this.availableTimeInHours; // knots (nm per hour)
    const requiredAirSpeed = requiredGroundSpeed + fuelOptimalPath.averageWind;

    const profileRowsForAltitude = getCruiseProfileRowsByAltitude(fuelOptimalPath.altitude);
    const speedOfSound = profileRowsForAltitude[0].speedOfSound;
    const requiredMach = requiredAirSpeed / speedOfSound;

    if (requiredMach >= minMach && requiredMach <= maxMach) {
      return fuelOptimalPath;
    }

    return null;
  }

  setCustomCostIndex(costIndex: number): void {
    this.costFactor.custom.CI = costIndex;
  }
}

function getFlightCost(fuelBurned: number, time: number, costFactor: { Cf: number, CI: number }) {
  const { Cf, CI } = costFactor;
  return Cf * (fuelBurned + CI * time);
}

function summarize(altSummary: AltitudeRun, fieldName: 'fuelBurnInKgs'|'timeInHours'|'distanceInMiles'): number {
  return altSummary.ascent[fieldName] + altSummary.cruise[fieldName] + altSummary.descent[fieldName];
}

function compareFn(a: [number, number, number], b: [number, number, number]) {
  if (a[0] === b[0]) {
    return a[1] < b[1] ? -1 : 1;
  }

  return 0;
}

import addSeconds from 'date-fns/addSeconds';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import isBefore from 'date-fns/isBefore';
import isAfter from 'date-fns/isAfter';
import {
  getCruiseProfileRowsByAltitude,
  getClimbProfileRowBySpeedAndAlt,
  getDescentProfileRowBySpeedAndAlt,
} from '../../flight-profiles';

import type { TotalRun, AltitudeRun, OptimalPath, RtaOptimalPath } from '../../types/interfaces';

type FlightsSummary = {
  fuel: number[][],
  time: number[][],
  combined: number[][],
};

const costFactor = {
  fuel: {
    Cf: 1,
    CI: 0,
  },
  time: {
    Cf: 1,
    CI: 9999,
  },
  custom: {
    Cf: 1,
    CI: 5000,
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
  sections: { climb: 0, cruise: 0, descent: 0 },
};

const MAX_RTA_DEVIATION_IN_SECONDS = 30;

export default class OptimalPathFinder {
  fuelOptimalPath: OptimalPath = emptyOptimalPath;
  timeOptimalPath: OptimalPath = emptyOptimalPath;
  combinedOptimalPath: OptimalPath = emptyOptimalPath;
  rtaOptimalPath: RtaOptimalPath|null = null;

  fuelOptimalRun: AltitudeRun|null = null;
  summarizedFlightsLog: FlightsSummary | null = null;

  costFactor = costFactor;
  startAltInFeet = 0;

  static calculateTimeArrivalConstraints(flightsLog: FlightsSummary | null): { min: number, max: number } {
    if (!flightsLog) {
      return {
        min: 0,
        max: 24,
      };
    }
    const sortedByTime = flightsLog.time.sort(compareByTime);
    const flightWithMinTime = sortedByTime[0];
    const flightWithMaxTime = sortedByTime[sortedByTime.length - 1];

    return {
      min: flightWithMinTime[4],
      max: flightWithMaxTime[4],
    };
  }

  findBasicOptimalPaths(totalRun: TotalRun): {
    optimal: { fuel: OptimalPath, time: OptimalPath, combined: OptimalPath },
    full: { fuel: number[][], time: number[][], combined: number[][] }
  } {
    let minimumFuelFlightCost = Number.MAX_SAFE_INTEGER;
    let minimumTimeFlightCost = Number.MAX_SAFE_INTEGER;
    let minimumCombinedFlightCost = Number.MAX_SAFE_INTEGER;
    let fuelOptimalPath: OptimalPath = emptyOptimalPath;
    let timeOptimalPath: OptimalPath = emptyOptimalPath;
    let combinedOptimalPath: OptimalPath = emptyOptimalPath;

    const flightCostLog: {
      fuel: number[][],
      time: number[][],
      combined: number[][],
    } = {
      fuel: [],
      time: [],
      combined: [],
    };

    for (const [speed, speedSummary] of totalRun) {
      for (const [altitude, altSummary] of speedSummary) {
        const fuelConsumption = summarize(altSummary, 'fuelBurnInKgs');
        const timeSpent = summarize(altSummary, 'timeInHours');
        const flightDistance = summarize(altSummary, 'distanceInMiles');
        const fuelFlightCost = getFlightCost(fuelConsumption, timeSpent, costFactor.fuel);
        const timeFlightCost = getFlightCost(fuelConsumption, timeSpent, costFactor.time);
        const combinedFlightCost = getFlightCost(fuelConsumption, timeSpent, costFactor.custom);

        flightCostLog.fuel.push([speed, altitude, fuelFlightCost, fuelConsumption, timeSpent, flightDistance]);
        flightCostLog.time.push([speed, altitude, timeFlightCost, fuelConsumption, timeSpent, flightDistance]);
        flightCostLog.combined.push([speed, altitude, combinedFlightCost, fuelConsumption, timeSpent, flightDistance]);

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
            sections: {
              climb: altSummary.ascent.distanceInMiles,
              cruise: altSummary.cruise.distanceInMiles,
              descent: altSummary.descent.distanceInMiles,
            },
            averageWind: getAverage([
              altSummary.ascent.averageWind,
              altSummary.cruise.averageWind,
              altSummary.descent.averageWind
            ].filter(wind => (wind >= 1))),
          };
          this.fuelOptimalRun = altSummary;
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
            sections: {
              climb: altSummary.ascent.distanceInMiles,
              cruise: altSummary.cruise.distanceInMiles,
              descent: altSummary.descent.distanceInMiles,
            },
            averageWind: getAverage([
              altSummary.ascent.averageWind,
              altSummary.cruise.averageWind,
              altSummary.descent.averageWind
            ].filter(wind => (wind >= 1))),
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
            sections: {
              climb: altSummary.ascent.distanceInMiles,
              cruise: altSummary.cruise.distanceInMiles,
              descent: altSummary.descent.distanceInMiles,
            },
            averageWind: getAverage([
              altSummary.ascent.averageWind,
              altSummary.cruise.averageWind,
              altSummary.descent.averageWind
            ].filter(wind => (wind >= 1))),
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
    this.summarizedFlightsLog = flightCostLog;

    return {
      full: flightCostLog,
      optimal: { fuel: fuelOptimalPath, time: timeOptimalPath, combined: combinedOptimalPath },
    };
  }

  findRTAOptimalPath(departureDate: Date, arrivalDate: Date, totalRun: TotalRun): void {
    const possibleArrivalTime = this.getPossibleArrivalTime(departureDate);

    if (isBefore(arrivalDate, possibleArrivalTime.min) || isAfter(arrivalDate, possibleArrivalTime.max)) {
      console.log('No route');
      this.rtaOptimalPath = null;
      return;
    }

    const availableTimeInSeconds = this.getAvailableTimeInSeconds(departureDate, arrivalDate);
    const applicablePaths = [];
    let minimumFlightCost = Number.MAX_SAFE_INTEGER;
    let rtaOptimalPath: OptimalPath = emptyOptimalPath;

    for (const [speed, speedSummary] of totalRun) {
      for (const [altitude, altSummary] of speedSummary) {
        const timeSpent = summarize(altSummary, 'timeInHours');
        const timeSpentInSeconds = timeSpent * 3600;
        const flightDistance = summarize(altSummary, 'distanceInMiles');
        const fuelConsumption = summarize(altSummary, 'fuelBurnInKgs');
        const flightCost = getFlightCost(fuelConsumption, timeSpent, costFactor.fuel);
        const isApplicable = Math.abs(timeSpentInSeconds - availableTimeInSeconds) <= MAX_RTA_DEVIATION_IN_SECONDS;

        if (isApplicable) {
          const path = {
            flightCost: flightCost,
            fuel: fuelConsumption,
            time: timeSpent,
            distance: flightDistance,
            speed,
            altitude,
            path: altSummary.cruise.path,
            sections: {
              climb: altSummary.ascent.distanceInMiles,
              cruise: altSummary.cruise.distanceInMiles,
              descent: altSummary.descent.distanceInMiles,
            },
            averageWind: (
              altSummary.ascent.averageWind + altSummary.cruise.averageWind + altSummary.descent.averageWind
            ) / 3,
          };
          applicablePaths.push(path);

          if (flightCost < minimumFlightCost) {
            minimumFlightCost = flightCost;
            rtaOptimalPath = path;
          }
        }
      }
    }

    console.log(`Всего возможных путей с минимумом задержки прибытия: ${applicablePaths.length}`);

    if (minimumFlightCost < Number.MAX_SAFE_INTEGER && rtaOptimalPath.flightCost !== 0) {
      this.rtaOptimalPath = {
        ...rtaOptimalPath,
        possibleAlternatives: applicablePaths,
      };
    }
  }

  calculateRTAFuel(
    availableTimeInHours: number,
    altitude: number,
    requiredMach: number
  ): number {
    if (!this.fuelOptimalRun) {
      return 0;
    }
    const ascDistance = this.fuelOptimalRun.ascent.distanceInMiles;
    const cruiseDistance = this.fuelOptimalRun.cruise.distanceInMiles;
    const descDistance = this.fuelOptimalRun.descent.distanceInMiles;
    const flightDistance = ascDistance + cruiseDistance + descDistance;

    const cruisePercent = cruiseDistance / flightDistance;
    const cruiseTime = availableTimeInHours * cruisePercent;

    const cruiseProfileRowsForAltitude = getCruiseProfileRowsByAltitude(altitude);
    const cruiseProfileRow = cruiseProfileRowsForAltitude.find(row => (
      row.speedM === this.fuelOptimalPath.speed
    ));
    if (!cruiseProfileRow) {
      throw new Error(`No cruise profile for ${this.fuelOptimalPath.speed} M`);
    }
    const cruiseFuel = cruiseProfileRow.fuel * cruiseTime;

    const climbProfile0 = getClimbProfileRowBySpeedAndAlt(requiredMach, this.startAltInFeet);
    const climbProfile1 = getClimbProfileRowBySpeedAndAlt(requiredMach, altitude);

    if (!climbProfile0 || !climbProfile1) {
      throw new Error(`No climb profile for ${requiredMach} M`);
    }

    const climbFuel0 = climbProfile0.fuelFrom0;
    const climbFuel1 = climbProfile1.fuelFrom0;
    const climbFuel = Math.abs(climbFuel1 - climbFuel0);

    const descentProfile0 = getDescentProfileRowBySpeedAndAlt(requiredMach, this.startAltInFeet);
    const descentProfile1 = getDescentProfileRowBySpeedAndAlt(requiredMach, altitude);

    if (!descentProfile0 || !descentProfile1) {
      throw new Error(`No descent profile for ${requiredMach} M`);
    }

    const descentFuel0 = descentProfile0.fuelFrom0;
    const descentFuel1 = descentProfile1.fuelFrom0;
    const descentFuel = Math.abs(descentFuel1 - descentFuel0);

    return (cruiseFuel + climbFuel + descentFuel);
  }

  setCustomCostIndex(costIndex: number): void {
    this.costFactor.custom.CI = costIndex;
  }

  setStartAlt(alt: number): void {
    this.startAltInFeet = alt;
  }

  getAvailableTimeInSeconds(startDate: Date, endDate: Date): number {
    const diffInSeconds = Math.abs(differenceInSeconds(startDate, endDate));
    return diffInSeconds;
  }

  getPossibleArrivalTime(departureDate: Date): { min: Date, max: Date } {
    const timeConstraints = OptimalPathFinder.calculateTimeArrivalConstraints(this.summarizedFlightsLog);
    const minArrivalTime = addSeconds(departureDate, timeConstraints.min * 3600);
    const maxArrivalTime = addSeconds(departureDate, timeConstraints.max * 3600);

    return { min: minArrivalTime, max: maxArrivalTime };
  }
}

function getFlightCost(fuelBurned: number, time: number, costFactor: { Cf: number, CI: number }) {
  const { Cf, CI } = costFactor;
  return Cf * (fuelBurned + CI * time);
}

function summarize(altSummary: AltitudeRun, fieldName: 'fuelBurnInKgs'|'timeInHours'|'distanceInMiles'): number {
  return altSummary.ascent[fieldName] + altSummary.cruise[fieldName] + altSummary.descent[fieldName];
}

function compareFn(a: number[], b: number[]) {
  if (a[0] === b[0]) {
    return a[1] < b[1] ? -1 : 1;
  }

  return 0;
}

function compareByTime(a: number[], b: number[]) {
  return a[4] - b[4];
}

function getAverage(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, item) => (acc + item), 0);
  return sum / arr.length;
}

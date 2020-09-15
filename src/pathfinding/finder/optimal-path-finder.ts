import addSeconds from 'date-fns/addSeconds';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import isBefore from 'date-fns/isBefore';
import isAfter from 'date-fns/isAfter';
import {
  getCruiseProfileRowsByAltitude,
  getClimbProfileRowBySpeedAndAlt,
  getDescentProfileRowBySpeedAndAlt,
} from '../../flight-profiles';
import settings from '../../app.settings';

import type { TotalRun, AltitudeRun, OptimalPath } from '../../types/interfaces';

const costFactor = {
  fuel: {
    Cf: 1,
    CI: 0,
  },
  time: {
    Cf: 1,
    CI: 3000,
  },
  custom: {
    Cf: 1,
    CI: 1500,
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

export default class OptimalPathFinder {
  fuelOptimalPath: OptimalPath = emptyOptimalPath;
  timeOptimalPath: OptimalPath = emptyOptimalPath;
  combinedOptimalPath: OptimalPath = emptyOptimalPath;
  rtaOptimalPath: OptimalPath|null = null;

  fuelOptimalRun: AltitudeRun|null = null;

  costFactor = costFactor;
  startAltInFeet = 0;

  static calculateTimeArrivalConstraints(fuelOptimalPath: OptimalPath): { min: number, max: number } {
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
            averageWind: (
              altSummary.ascent.averageWind + altSummary.cruise.averageWind + altSummary.descent.averageWind
            ) / 3,
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

    return {
      full: flightCostLog,
      optimal: { fuel: fuelOptimalPath, time: timeOptimalPath, combined: combinedOptimalPath },
    };
  }

  findRTAOptimalPath(departureDate: Date, arrivalDate: Date): void {
    const possibleArrivalTime = this.getPossibleArrivalTime(departureDate);

    if (isBefore(arrivalDate, possibleArrivalTime.min) || isAfter(arrivalDate, possibleArrivalTime.max)) {
      console.log('No route');
      this.rtaOptimalPath = null;
      return;
    }

    const availableTimeInHours = this.getAvailableTime(departureDate, arrivalDate);
    const requiredGroundSpeed = this.fuelOptimalPath.distance / availableTimeInHours; // knots (nm per hour)
    const requiredAirSpeed = requiredGroundSpeed - this.fuelOptimalPath.averageWind;

    const profileRowsForAltitude = getCruiseProfileRowsByAltitude(this.fuelOptimalPath.altitude);
    const speedOfSound = profileRowsForAltitude[0].speedOfSound;
    const requiredMach = parseFloat((requiredAirSpeed / speedOfSound).toPrecision(2));
    const rtaFuel = this.calculateRTAFuel(
      availableTimeInHours, this.fuelOptimalPath.altitude, requiredMach
    ) || this.fuelOptimalPath.fuel;

    this.rtaOptimalPath = {
      ...this.fuelOptimalPath,
      fuel: rtaFuel,
      speed: requiredMach,
      time: availableTimeInHours,
    };
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

  getAvailableTime(startDate: Date, endDate: Date): number {
    const diffInSeconds = Math.abs(differenceInSeconds(startDate, endDate));
    return (diffInSeconds / 3600);
  }

  getPossibleArrivalTime(departureDate: Date): { min: Date, max: Date } {
    const timeConstraints = OptimalPathFinder.calculateTimeArrivalConstraints(this.fuelOptimalPath);
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

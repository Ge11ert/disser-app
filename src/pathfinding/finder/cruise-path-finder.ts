import AStarFinder from './a-star-finder';
import GridNode from '../core/node';
import { fromMilesToMeters, fromKnotsToMetersPerSecond } from '../../utils/converters';
import { CruiseProfile, AirConditions } from '../../types/interfaces';

import type { finderOptions } from './a-star-finder';

interface cruiseOptions {
  profile: CruiseProfile,
  airConditions: AirConditions,
  speedM: number, // units
  speedV: number, // knots
  altitude: number, // feet,
}

const Cf = 1; // fuel cost
const CI = 0; // Cost Index

export default class CruisePathFinder extends AStarFinder {
  private altSpecificProfile: CruiseProfile;
  private cruiseOptions: cruiseOptions;
  private possibleMachSpeeds: number[];

  private readonly altSpecificSpeedOfSound: number; // knots

  constructor(finderOptions: finderOptions, cruiseOptions: cruiseOptions) {
    super(finderOptions);

    this.cruiseOptions = cruiseOptions;
    this.altSpecificProfile = cruiseOptions.profile.filter((profileRow) => (
      profileRow.altitude === cruiseOptions.altitude
    ));
    this.possibleMachSpeeds = this.altSpecificProfile.reduce<number[]>((acc, profileRow) => {
      acc.push(profileRow.speedM);
      return acc;
    }, []);

    const currentProfileRow = this.getProfileRowBySpeedM(cruiseOptions.speedM);
    this.cruiseOptions.speedV = currentProfileRow ? currentProfileRow.speedV : this.altSpecificProfile[0].speedV;
    this.altSpecificSpeedOfSound = this.altSpecificProfile[0].speedOfSound;
  }

  getNeighborG(currentNode: GridNode, neighborNode: GridNode): number {
    const { distance: distanceToNeighbour } = currentNode.distanceTo(neighborNode); // miles

    // переводим дистанцию в метры
    const distanceInMeters = fromMilesToMeters(distanceToNeighbour);

    // Получаем скорость относительно земли (с учётом ветра)
    const speedV = this.cruiseOptions.speedV;
    const groundSpeed = this.getGroundSpeedV(speedV, neighborNode); // knots;
    const groundSpeedInMetersPerSecond = fromKnotsToMetersPerSecond(groundSpeed);

    // получаем Мах для ground speed из скорости звука на текущей высоте
    const gsMach = groundSpeed / this.altSpecificSpeedOfSound;
    const roundedMach = Number(gsMach.toPrecision(2));
    const recalculatedMach = getClosest(this.possibleMachSpeeds, roundedMach);

    // получаем время пролёта полученной дистанции в секундах и часах
    const flightTimeInSeconds = distanceInMeters / groundSpeedInMetersPerSecond; // seconds
    const flightTimeInHours = flightTimeInSeconds / 3600;

    // находим строку в профиле для нового значения M (с учётом ветра)
    const profileRowByRecalculatedM = this.getProfileRowBySpeedM(recalculatedMach);

    if (!profileRowByRecalculatedM) {
      // что-то пошло не так и такой строки в профиле не найдено, abort mission
      return Number.MAX_SAFE_INTEGER;
    }

    // считаем затраты топлива
    const fuelBurnHourly = profileRowByRecalculatedM.fuel;
    const actualFuelBurn = fuelBurnHourly * flightTimeInHours; // kg

    // считаем FlightCost по затраченному топливу и времени
    const flightCostToNeighbour = this.getFlightCost(actualFuelBurn, flightTimeInHours);

    return flightCostToNeighbour;
  }

  getNeighborH(neighborNode: GridNode, endNode: GridNode): number {
    const { distance: distanceToEnd } = neighborNode.distanceTo(endNode);
    const distanceToEndInMeters = fromMilesToMeters(distanceToEnd);

    // берём текущую скорость в узлах (ветер не считаем) и переводим в м/с
    const speedV = this.cruiseOptions.speedV;
    const speedInMetersPerSecond = fromKnotsToMetersPerSecond(speedV);

    // получаем время пролёта полученной дистанции в секундах и часах
    const flightTimeInSeconds = distanceToEndInMeters / speedInMetersPerSecond;
    const flightTimeInHours = flightTimeInSeconds / 3600;

    const profileRowByM = this.getProfileRowBySpeedM(this.cruiseOptions.speedM);

    if (!profileRowByM) {
      // что-то пошло не так и такой строки в профиле не найдено, abort mission
      return Number.MAX_SAFE_INTEGER;
    }

    const fuelBurnHourly = profileRowByM.fuel;
    const actualFuelBurn = fuelBurnHourly * flightTimeInHours; // kg

    // считаем FlightCost по затраченному топливу и времени
    const flightCostToEnd = this.getFlightCost(actualFuelBurn, flightTimeInHours);

    return flightCostToEnd;
  }

  /**
   * @param {number} fuelBurned — затраты топлива в килограммах
   * @param {number} time — затраты времени в часах
   */
  getFlightCost(fuelBurned: number, time: number) {
    return Cf * (fuelBurned + CI * time);
  }

  getProfileRowBySpeedM(speedM: number): CruiseProfile[0]|undefined {
    return this.altSpecificProfile.find(row => (row.speedM === speedM));
  }

  getProfileRowByAltitude(alt: number): CruiseProfile[0]|undefined {
    return this.altSpecificProfile.find(row => (row.altitude === alt));
  }

  getGroundSpeedV(speedV: number, point: GridNode): number {
    const windAtPoint = this.cruiseOptions.airConditions[point.y][point.x] as number; // knots
    return speedV + windAtPoint;
  }
}

function getClosest(array: number[], val: number): number {
  return array.reduce((a, b) => {
    return Math.abs(b - val) < Math.abs(a - val) ? b : a;
  });
}

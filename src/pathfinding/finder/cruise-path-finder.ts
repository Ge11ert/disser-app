import AStarFinder from './a-star-finder';
import GridNode from '../core/node';
import { fromMilesToMeters, fromKnotsToMetersPerSecond } from '../../utils/converters';
import { getCruiseProfileRowsByAltitude } from '../../flight-profiles';

import type { CruiseProfile, AirConditions } from '../../types/interfaces';
import type { finderOptions } from './a-star-finder';

interface cruiseOptions {
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

  private readonly altSpecificSpeedOfSound: number; // knots
  private readonly currentProfileRow: CruiseProfile[0];

  constructor(finderOptions: finderOptions, cruiseOptions: cruiseOptions) {
    super(finderOptions);

    this.cruiseOptions = cruiseOptions;
    this.altSpecificProfile = getCruiseProfileRowsByAltitude(cruiseOptions.altitude);

    const currentProfileRow = this.getProfileRowBySpeedM(cruiseOptions.speedM);

    if (!currentProfileRow) {
      throw new Error(`No cruise profile for altitude ${cruiseOptions.altitude} and speed ${cruiseOptions.speedM}`);
    }

    this.cruiseOptions.speedV = currentProfileRow.speedV;
    this.altSpecificSpeedOfSound = this.altSpecificProfile[0].speedOfSound;
    this.currentProfileRow = currentProfileRow;
  }

  checkIfRoutePossible(): boolean {
    return this.currentProfileRow.fuel > 0;
  }

  setNeighborProps(ng: number, currentNode: GridNode, neighborNode: GridNode, endNode: GridNode) {
    super.setNeighborProps(ng, currentNode, neighborNode, endNode);

    const { distance, fuel, time } = this.getTranslationParameters(currentNode, neighborNode, true);

    neighborNode.distanceFromNeighbourInMiles = distance;
    neighborNode.fuelBurnFromNeighbourInKgs = fuel;
    neighborNode.timeFromNeighbourInHours = time;
    neighborNode.windAtNode = this.getWind(neighborNode);

    currentNode.windAtNode = this.getWind(currentNode);
  }

  getNeighborG(currentNode: GridNode, neighborNode: GridNode): number {
    const { fuel, time } = this.getTranslationParameters(currentNode, neighborNode, true);

    return this.getFlightCost(fuel, time);
  }

  getNeighborH(neighborNode: GridNode, endNode: GridNode): number {
    const { fuel, time } = this.getTranslationParameters(neighborNode, endNode, false);

    return this.getFlightCost(fuel, time);
  }

  getTranslationParameters(
    sourceNode: GridNode,
    goalNode: GridNode,
    accountWind: boolean,
  ): { distance: number, fuel: number, time: number} {
    const { distance: distanceToNeighbour } = sourceNode.distanceTo(goalNode); // miles

    // переводим дистанцию в метры
    const distanceInMeters = fromMilesToMeters(distanceToNeighbour);

    // Если нужно учесть ветер, получаем скорость относительно земли (с учётом ветра)
    const speedV = this.cruiseOptions.speedV;
    const groundSpeed = accountWind ? this.getGroundSpeedV(speedV, goalNode) : speedV; // knots;
    const groundSpeedInMetersPerSecond = fromKnotsToMetersPerSecond(groundSpeed);

    // получаем время пролёта полученной дистанции в секундах и часах
    const flightTimeInSeconds = distanceInMeters / groundSpeedInMetersPerSecond; // seconds
    const flightTimeInHours = flightTimeInSeconds / 3600;

    // считаем затраты топлива
    const fuelBurnHourly = this.currentProfileRow.fuel;
    const actualFuelBurn = fuelBurnHourly * flightTimeInHours; // kg

    return { distance: distanceToNeighbour, fuel: actualFuelBurn, time: flightTimeInHours };
  }

  findPathWithSummary(...args: any[]): { path: number[][], summary: Record<string, number>} {
    // TODO: fix ts-ignore
    // @ts-ignore
    const path = super.findPath(...args);

    let totalDistance = 0;
    let totalFuelBurn = 0;
    let totalTime = 0;

    path.forEach(cell => {
      const [, , distance, fuel, time] = cell;
      totalDistance += distance;
      totalFuelBurn += fuel;
      totalTime += time;
    });

    const averageWind = path.reduce((acc, cell) => {
      return (acc + cell[5]);
    }, 0) / path.length;

    return {
      path,
      summary: {
        totalDistance,
        totalFuelBurn,
        totalTime,
        averageWind,
      },
    };
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

  getGroundSpeedV(speedV: number, point: GridNode): number {
    const windAtPoint = this.getWind(point); // knots
    return speedV + windAtPoint;
  }

  getWind(point: GridNode): number {
    return (this.cruiseOptions.airConditions[point.y][point.x] as number);
  }
}

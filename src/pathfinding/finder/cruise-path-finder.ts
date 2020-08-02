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

  private readonly altSpecificSpeedOfSound: number; // knots
  private readonly currentProfileRow: CruiseProfile[0];

  constructor(finderOptions: finderOptions, cruiseOptions: cruiseOptions) {
    super(finderOptions);

    this.cruiseOptions = cruiseOptions;
    this.altSpecificProfile = cruiseOptions.profile.filter((profileRow) => (
      profileRow.altitude === cruiseOptions.altitude
    ));

    const currentProfileRow = this.getProfileRowBySpeedM(cruiseOptions.speedM);

    if (!currentProfileRow) {
      throw new Error(`No cruise profile for altitude ${cruiseOptions.altitude} and speed ${cruiseOptions.speedM}`);
    }

    this.cruiseOptions.speedV = currentProfileRow.speedV;
    this.altSpecificSpeedOfSound = this.altSpecificProfile[0].speedOfSound;
    this.currentProfileRow = currentProfileRow;
  }

  getNeighborG(currentNode: GridNode, neighborNode: GridNode): number {
    const { distance: distanceToNeighbour } = currentNode.distanceTo(neighborNode); // miles

    // переводим дистанцию в метры
    const distanceInMeters = fromMilesToMeters(distanceToNeighbour);

    // Получаем скорость относительно земли (с учётом ветра)
    const speedV = this.cruiseOptions.speedV;
    const groundSpeed = this.getGroundSpeedV(speedV, neighborNode); // knots;
    const groundSpeedInMetersPerSecond = fromKnotsToMetersPerSecond(groundSpeed);

    // получаем время пролёта полученной дистанции в секундах и часах
    const flightTimeInSeconds = distanceInMeters / groundSpeedInMetersPerSecond; // seconds
    const flightTimeInHours = flightTimeInSeconds / 3600;

    // считаем затраты топлива
    const fuelBurnHourly = this.currentProfileRow.fuel;
    const actualFuelBurn = fuelBurnHourly * flightTimeInHours; // kg

    // считаем FlightCost по затраченному топливу и времени
    const flightCostToNeighbour = this.getFlightCost(actualFuelBurn, flightTimeInHours);

    neighborNode.distanceFromNeighbourInMiles = distanceToNeighbour;
    neighborNode.fuelBurnFromNeighbourInKgs = actualFuelBurn;
    neighborNode.timeFromNeighbourInHours = flightTimeInHours;
    neighborNode.windAtNode = this.getWind(neighborNode);

    currentNode.windAtNode = this.getWind(currentNode);

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

    const fuelBurnHourly = this.currentProfileRow.fuel;
    const actualFuelBurn = fuelBurnHourly * flightTimeInHours; // kg

    // считаем FlightCost по затраченному топливу и времени
    return this.getFlightCost(actualFuelBurn, flightTimeInHours);
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

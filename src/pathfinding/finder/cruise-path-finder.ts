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

const Cf = 1;
const Ct = 0;

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
    const gsMach = groundSpeed / this.altSpecificSpeedOfSound;
    const roundedMach = Number(gsMach.toPrecision(2));
    const groundSpeedInMetersPerSecond = fromKnotsToMetersPerSecond(groundSpeed);

    const flightTimeInSeconds = distanceInMeters / groundSpeedInMetersPerSecond; // seconds
    const flightTimeInHours = flightTimeInSeconds / 3600;

    // находим строку в профиле для нового значения M (с учётом ветра)
    const profileRowByRecalculatedM = this.getProfileRowBySpeedM(roundedMach);
    // TODO: проверять, что нашли такое
    const fuelBurnHourly = profileRowByRecalculatedM!.fuel;
    const actualFuelBurn = fuelBurnHourly * flightTimeInHours; // kg

    // считаем FlightCost по затраченному топливу и времени
    const flightCostToNeighbour = this.getFlightCost(actualFuelBurn, flightTimeInHours);

    return flightCostToNeighbour;
  }

  getNeighborH(neighborNode: GridNode, endNode: GridNode): number {
    const { distance: distanceToEnd } = neighborNode.distanceTo(endNode);
    const distanceToEndInMeters = fromMilesToMeters(distanceToEnd);

    const speedV = this.cruiseOptions.speedV;
    const speedInMetersPerSecond = fromKnotsToMetersPerSecond(speedV);

    const flightTimeInSeconds = distanceToEndInMeters / speedInMetersPerSecond;
    const flightTimeInHours = flightTimeInSeconds / 3600;

    const profileRowByM = this.getProfileRowBySpeedM(this.cruiseOptions.speedM);
    const fuelBurnHourly = profileRowByM!.fuel;
    const actualFuelBurn = fuelBurnHourly * flightTimeInHours; // kg

    // считаем FlightCost по затраченному топливу и времени
    const flightCostToEnd = this.getFlightCost(actualFuelBurn, flightTimeInHours);

    return flightCostToEnd;
  }

  getFlightCost(fuelBurned: number, time: number) {
    return (Cf * fuelBurned + Ct*time);
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

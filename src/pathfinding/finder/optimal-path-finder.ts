import { TotalRun, AltitudeRun } from '../../types/interfaces';

type OptimalPath = {
  flightCost: number,
  fuel: number,
  time: number,
  distance: number,
  speed: number,
  altitude: number,
  path: number[][],
}

const costFactor = {
  fuel: {
    Cf: 1,
    CI: 0,
  },
  time: {
    Cf: 1,
    CI: 99,
  },
}

export default class OptimalPathFinder {
  fuelOptimalPath: OptimalPath|null = null;

  constructor(private totalRun: TotalRun) {}

  findOptimalPaths(): void {
    let minimumFuelFlightCost = Number.MAX_SAFE_INTEGER;
    let fuelOptimalPath: OptimalPath|null = null;

    for (const [speed, speedSummary] of this.totalRun) {
      for (const [altitude, altSummary] of speedSummary) {
        const fuelConsumption = summarize(altSummary, 'fuelBurnInKgs');
        const timeSpent = summarize(altSummary, 'timeInHours');
        const flightDistance = summarize(altSummary, 'distanceInMiles');
        const routeFlightCost = getFlightCost(fuelConsumption, timeSpent, costFactor.fuel);

        if (routeFlightCost < minimumFuelFlightCost) {
          minimumFuelFlightCost = routeFlightCost;
          fuelOptimalPath = {
            flightCost: routeFlightCost,
            fuel: fuelConsumption,
            time: timeSpent,
            distance: flightDistance,
            speed,
            altitude,
            path: altSummary.cruise.path,
          };
        }
      }
    }

    this.fuelOptimalPath = fuelOptimalPath;
  }
}

function getFlightCost(fuelBurned: number, time: number, costFactor: { Cf: number, CI: number }) {
  const { Cf, CI } = costFactor;
  return Cf * (fuelBurned + CI * time);
}

function summarize(altSummary: AltitudeRun, fieldName: 'fuelBurnInKgs'|'timeInHours'|'distanceInMiles'): number {
  return altSummary.ascent[fieldName] + altSummary.cruise[fieldName] + altSummary.descent[fieldName];
}

import ElectronApp from './electron/server';
import Grid from './pathfinding/core/grid';
import AStartFinder from './pathfinding/finder/a-star-finder';
import CruisePathFinder from './pathfinding/finder/cruise-path-finder';
import Geo from './geo';
import { cell } from './constants/grid';

import type { DisserAppAPI, AirConditions, CruiseProfile } from './types/interfaces';

const cruiseProfile: CruiseProfile = require('./assets/cruise_profile.json');

export default class DisserApp implements DisserAppAPI {
  private electronApp: ElectronApp;
  private airConditions: AirConditions = [];
  private finderMatrix: number[][] = [];
  private finderGrid: Grid|null = null;
  private gridType: 'coords'|'airConditions' = 'airConditions';

  private readonly geo: Geo;

  constructor(public settings: { electron: Record<string, any> }) {
    this.electronApp = new ElectronApp(settings.electron, this);
    this.geo = new Geo();
  }

  startElectronApp() {
    this.electronApp.start();
  }

  applyAirConditions(airConditions: AirConditions) {
    const matrixForFinderGrid = convertAirConditionsToWalkableMatrix(airConditions);
    this.airConditions = airConditions;
    this.finderMatrix = matrixForFinderGrid;
    this.finderGrid = new Grid(matrixForFinderGrid);
    this.finderGrid.setCellSize({ x: cell.H_SIZE, y: cell.V_SIZE });
    this.gridType = 'airConditions';
  }

  applyInitialGeoConditions(geoConditions: Record<string, string>) {
    this.geo.applyStartAndFinalCoords(geoConditions);
    this.geo.findDistanceBetweenStartAndEndPoints();
    this.createGridFromGeoCoords();
  }

  startFinder(): void|never {
    if (!this.geo.isCoordsLoaded()) {
      throw new Error('No coords for start and dest points');
    }

    if (this.finderGrid === null) {
      throw new Error('No pathfinding grid specified');
    }

    const finder = new CruisePathFinder(
      { allowDiagonal: true },
      {
        profile: cruiseProfile,
        airConditions: this.airConditions,
        speedM: 0.74,
        speedV: 0,
        altitude: this.geo.startAltInFeet,
      }
    );
    const path = finder.findPath(0, 0, this.finderGrid.width - 1, this.finderGrid.height - 1, this.finderGrid);

    this.sendResults(path);
  }

  createGridFromGeoCoords(): void {
    const { distanceInMiles } = this.geo;

    const roundedX = Math.round(distanceInMiles.x);
    const roundedY = Math.round(distanceInMiles.y);

    const maxCellsX = Math.ceil(roundedX / cell.H_SIZE);
    const maxCellsY = Math.ceil(roundedY / cell.V_SIZE);

    this.finderGrid = new Grid(maxCellsX, maxCellsY);
    this.finderGrid.setCellSize({ x: cell.H_SIZE, y: cell.V_SIZE });
    this.gridType = 'coords';
  }

  sendResults(path: ReturnType<AStartFinder['findPath']>): void {
    if (this.finderGrid === null) {
      throw new Error('No pathfinding grid specified');
    }

    const messageParts = [
      `Используется сетка из ${this.gridType === 'coords' ? 'координат' : 'условий маршрута'}.`,
      'Из точки: [0,0].',
      `В точку: [${this.finderGrid.width - 1}, ${this.finderGrid.height - 1}].`,
      'Найденный маршрут',
      JSON.stringify(path),
    ];
    const result = messageParts.join('<br/>');
    this.electronApp.sendToWindow(result);
  }
}

function convertAirConditionsToWalkableMatrix(conditions: AirConditions): number[][] {
  return conditions.map((row) => {
    return row.map((cell) => (
      typeof cell === 'string' && cell.toLowerCase() === 'x') ? 1 : 0
    );
  });
}

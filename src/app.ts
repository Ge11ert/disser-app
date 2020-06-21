import startElectronApp from './electron/server';
import Grid from './pathfinding/core/grid';
import AStartFinder from './pathfinding/finder/a-star-finder';
import { DisserAppAPI, AirConditions } from './types/interfaces';

export default class DisserApp implements DisserAppAPI {
  private airConditions: AirConditions = [];
  private finderMatrix: number[][] = [];
  private finderGrid: Grid|null = null;

  constructor(public settings: { electron: Record<string, any> }) {}

  startElectronApp() {
    startElectronApp(this.settings.electron, this);
  }

  applyAirConditions(airConditions: AirConditions) {
    const matrixForFinderGrid = convertAirConditionsToWalkableMatrix(airConditions);
    this.airConditions = airConditions;
    this.finderMatrix = matrixForFinderGrid;
    this.finderGrid = new Grid(matrixForFinderGrid);
  }

  startFinder(): void|never {
    if (this.finderGrid === null) {
      throw new Error('No pathfinding grid specified');
    }
    const finder = new AStartFinder({
      allowDiagonal: true,
    });
    // TODO: вводить стартовую и конечную точки
    const path = finder.findPath(0, 0, 4, 7, this.finderGrid);
    console.log(path);
  }
}

function convertAirConditionsToWalkableMatrix(conditions: AirConditions): number[][] {
  return conditions.map((row) => {
    return row.map((cell) => (
      typeof cell === 'string' && cell.toLowerCase() === 'x') ? 1 : 0
    );
  });
}

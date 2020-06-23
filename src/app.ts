import ElectronApp from './electron/server';
import Grid from './pathfinding/core/grid';
import AStartFinder from './pathfinding/finder/a-star-finder';
import { DisserAppAPI, AirConditions } from './types/interfaces';
import { cell } from './constants/grid';

export default class DisserApp implements DisserAppAPI {
  private electronApp: ElectronApp;
  private airConditions: AirConditions = [];
  private finderMatrix: number[][] = [];
  private finderGrid: Grid|null = null;

  constructor(public settings: { electron: Record<string, any> }) {
    this.electronApp = new ElectronApp(settings.electron, this);
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

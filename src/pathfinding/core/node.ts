/**
 * A node in grid.
 * This class holds some basic information about a node and custom
 * attributes may be added, depending on the algorithms' needs.
 */
export default class GridNode {
  g: number = 0;
  f: number = 0;
  h: number = 0;
  opened: boolean = false;
  closed: boolean = false;

  /// ПЛОХО!

  distanceFromNeighbourInMiles: number = 0;
  fuelBurnFromNeighbourInKgs: number = 0;
  timeFromNeighbourInHours: number = 0;
  flightCostFromNeighbour: number = 0; // CI = 0

  private defaultSize = { x: 1, y: 1};

  constructor(
    public x: number,
    public y: number,
    public walkable: boolean = true,
    private size?: { x: number, y: number },
    public parent?: GridNode|undefined,
  ) {}

  setSize(size: { x: number, y: number }) {
    this.size = size;
  }

  distanceTo(goalNode: GridNode): { dx: number, dy: number, distance: number } {
    const cellSize = this.size || this.defaultSize;
    const dx = Math.abs(this.x - goalNode.x) * cellSize.x;
    const dy = Math.abs(this.y - goalNode.y) * cellSize.y;

    if (dx === 0 || dy === 0) {
      return { dx, dy, distance: Math.max(dx, dy) };
    }

    return { dx, dy, distance: Math.hypot(dx, dy) };
  }
}

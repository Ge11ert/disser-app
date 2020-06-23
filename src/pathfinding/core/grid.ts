import GridNode from './node';
import DiagonalMovement from './diagonal-movement';

type walkableStatus = number|boolean;
type Matrix = walkableStatus[][];
type NodeMatrix = GridNode[][];
type MoveInDirectionStatus = [boolean, boolean, boolean, boolean];

export default class Grid {
  public width: number;
  public height: number;
  public nodes: NodeMatrix;

  constructor(widthOrMatrix: number|Matrix, height?: number, matrix?: Matrix) {
    let localWidth: number;
    let localHeight: number;
    let localMatrix: Matrix|undefined;

    if (typeof widthOrMatrix !== 'object') {
      localWidth = widthOrMatrix;
      localHeight = height || localWidth;
      localMatrix = matrix;
    } else {
      localHeight = widthOrMatrix.length;
      localWidth = widthOrMatrix[0].length;
      localMatrix = widthOrMatrix;
    }

    this.width = localWidth;
    this.height = localHeight;
    this.nodes = Grid.buildNodes(localWidth, localHeight, localMatrix);
  }

  private static buildNodes(width: number, height: number, matrix: Matrix|undefined): NodeMatrix|never {
    const nodes: NodeMatrix = new Array(height);

    for (let i = 0; i < height; i++) {
      nodes[i] = new Array(width);

      for (let j = 0; j < width; j++) {
        nodes[i][j] = new GridNode(j, i);
      }
    }

    if (matrix === undefined) {
      return nodes;
    }

    if (matrix.length !== height || matrix[0].length !== width) {
      throw new Error('Matrix size does not fit');
    }

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (matrix[i][j]) {
          // 0, false, null will be walkable
          // while others will be un-walkable
          nodes[i][j].walkable = false;
        }
      }
    }

    return nodes;
  }

  getNodeAt(x: number, y: number): GridNode {
    return this.nodes[y][x];
  }

  /**
   * Determine whether the node at the given position is walkable.
   * (Also returns false if the position is outside the grid.)
   */
  isWalkableAt(x: number, y: number): boolean {
    return this.isInside(x, y) && this.nodes[y][x].walkable;
  }

  /**
   * Determine whether the position is inside the grid.
   * XXX: `grid.isInside(x, y)` is weird to read.
   * It should be `(x, y) is inside grid`, but I failed to find a better
   * name for this method.
   */
  isInside(x: number, y: number): boolean {
    return (x >= 0 && x < this.width) && (y >= 0 && y < this.height);
  }

  /**
   * Set whether the node on the given position is walkable.
   * NOTE: throws exception if the coordinate is not inside the grid.
   */
  setWalkableAt(x: number, y: number, walkable: boolean): void {
    this.nodes[y][x].walkable = walkable;
  }

  setCellSize(cellSize: { x: number, y: number }) {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        this.nodes[i][j].setSize(cellSize);
      }
    }
  }

  /**
   * Get the neighbors of the given node.
   *
   *     offsets      diagonalOffsets:
   *  +---+---+---+    +---+---+---+
   *  |   | 0 |   |    | 0 |   | 1 |
   *  +---+---+---+    +---+---+---+
   *  | 3 |   | 1 |    |   |   |   |
   *  +---+---+---+    +---+---+---+
   *  |   | 2 |   |    | 3 |   | 2 |
   *  +---+---+---+    +---+---+---+
   *
   *  When allowDiagonal is true, if offsets[i] is valid, then
   *  diagonalOffsets[i] and
   *  diagonalOffsets[(i + 1) % 4] is valid.
   */
  getNeighbors(node: GridNode, diagonalMovement: DiagonalMovement): GridNode[]|never {
    const x = node.x;
    const y = node.y;
    const neighbors: GridNode[] = [];
    const nodes = this.nodes;

    const s: MoveInDirectionStatus = [false, false, false, false]; // ↑ → ↓ ←
    const d: MoveInDirectionStatus = [false, false, false, false]; // ↖ ↗ ↘ ↙

    // ↑
    if (this.isWalkableAt(x, y - 1)) {
      neighbors.push(nodes[y - 1][x]);
      s[0] = true;
    }
    // →
    if (this.isWalkableAt(x + 1, y)) {
      neighbors.push(nodes[y][x + 1]);
      s[1] = true;
    }
    // ↓
    if (this.isWalkableAt(x, y + 1)) {
      neighbors.push(nodes[y + 1][x]);
      s[2] = true;
    }
    // ←
    if (this.isWalkableAt(x - 1, y)) {
      neighbors.push(nodes[y][x - 1]);
      s[3] = true;
    }

    if (diagonalMovement === DiagonalMovement.NEVER) {
      return neighbors;
    }

    switch (diagonalMovement) {
      case DiagonalMovement.ONLY_WHEN_NO_OBSTACLES: {
        d[0] = s[3] && s[0];
        d[1] = s[0] && s[1];
        d[2] = s[1] && s[2];
        d[3] = s[2] && s[3];
        break;
      }
      case DiagonalMovement.IF_AT_MOST_ONE_OBSTACLE: {
        d[0] = s[3] || s[0];
        d[1] = s[0] || s[1];
        d[2] = s[1] || s[2];
        d[3] = s[2] || s[3];
        break;
      }
      case DiagonalMovement.ALWAYS: {
        d[0] = true;
        d[1] = true;
        d[2] = true;
        d[3] = true;
        break;
      }
      default:
        throw new Error('Incorrect value of diagonalMovement');
    }

    // ↖
    if (d[0] && this.isWalkableAt(x - 1, y - 1)) {
      neighbors.push(nodes[y - 1][x - 1]);
    }
    // ↗
    if (d[1] && this.isWalkableAt(x + 1, y - 1)) {
      neighbors.push(nodes[y - 1][x + 1]);
    }
    // ↘
    if (d[2] && this.isWalkableAt(x + 1, y + 1)) {
      neighbors.push(nodes[y + 1][x + 1]);
    }
    // ↙
    if (d[3] && this.isWalkableAt(x - 1, y + 1)) {
      neighbors.push(nodes[y + 1][x - 1]);
    }

    return neighbors;
  }
}

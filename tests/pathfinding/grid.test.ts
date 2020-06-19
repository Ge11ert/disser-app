import Grid from '../../src/pathfinding/core/grid';
import GridNode from '../../src/pathfinding/core/node';
import DiagonalMovement from '../../src/pathfinding/core/diagonal-movement';

describe('Grid', () => {
  describe('generate without matrix', () => {
    const width = 10;
    const height = 20;
    let grid: Grid;

    beforeEach(() => {
      grid = new Grid(width, height);
    });

    it('should have correct size', () => {
      expect(grid.width).toBe(width);
      expect(grid.height).toBe(height);
      expect(grid.nodes).toHaveLength(height);

      for (let i = 0; i < height; i++) {
        expect(grid.nodes[i]).toHaveLength(width);
      }
    });

    it('should set all nodes\' walkable attribute', () => {
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          expect(grid.isWalkableAt(j, i)).toBe(true);
        }
      }
    });
  });

  describe('generate with matrix', () => {
    let matrix: number[][];
    let grid: Grid;
    let width: number;
    let height: number;

    const enumPos = function(f: Function, o?: any) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (o) {
            f.call(o, x, y, grid);
          } else {
            f(x, y, grid)
          }
        }
      }
    }

    beforeEach(function() {
      matrix = [
        [1, 0, 0, 1],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
        [1, 0, 0, 1],
      ];
      height = matrix.length;
      width = matrix[0].length;
      grid = new Grid(width, height, matrix);
    });

    it('should have correct size', () => {
      expect(grid.width).toBe(width);
      expect(grid.height).toBe(height);
      expect(grid.nodes).toHaveLength(height);

      for (let i = 0; i < height; i++) {
        expect(grid.nodes[i]).toHaveLength(width);
      }
    });

    it('should initiate all nodes with walkable attribute', () => {
      enumPos((x: number, y: number, g: Grid) => {
        if (matrix[y][x]) {
          expect(g.isWalkableAt(x, y)).toBe(false);
        } else {
          expect(g.isWalkableAt(x, y)).toBe(true);
        }
      });
    });

    it('should be able to set nodes\' walkable attribute', () => {
      enumPos((x: number, y: number) => {
        grid.setWalkableAt(x, y, false);
      });
      enumPos((x: number, y: number) => {
        expect(grid.isWalkableAt(x, y)).toBe(false);
      });
      enumPos((x: number, y: number) => {
        grid.setWalkableAt(x, y, true);
      });
      enumPos((x: number, y: number) => {
        expect(grid.isWalkableAt(x, y)).toBe(true);
      });
    });

    it('should return correct answer for position validity query', () => {
      const asserts: [number, number, boolean][] = [
        [0, 0, true],
        [0, height - 1, true],
        [width - 1, 0, true],
        [width - 1, height - 1, true],
        [-1, -1, false],
        [0, -1, false],
        [-1, 0, false],
        [0, height, false],
        [width, 0, false],
        [width, height, false],
      ];

      asserts.forEach((assert) => {
        expect(grid.isInside(assert[0], assert[1])).toBe(assert[2]);
      });
    });

    it('should return correct neighbors', () => {
      const cmp = (a: GridNode, b: GridNode) => (
        a.x * 100 + a.y - b.x * 100 - b.y
      );
      expect(grid.getNeighbors(grid.nodes[1][0], DiagonalMovement.NEVER)).toEqual([grid.nodes[2][0]]);
      expect(
        grid.getNeighbors(grid.nodes[0][2], DiagonalMovement.IF_AT_MOST_ONE_OBSTACLE).sort(cmp)
      ).toEqual([grid.nodes[0][1], grid.nodes[1][2], grid.nodes[1][3]].sort(cmp));
    });
  });

  describe('generate with matrix and no width or height', () => {
    let matrix: number[][];
    let grid: Grid;

    beforeEach(function() {
      matrix = [
        [1, 0, 0, 1],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
        [1, 0, 0, 1],
      ];
      grid = new Grid(matrix);
    });

    it('should have correct size', () => {
      const height = matrix.length;
      const width = matrix[0].length;

      expect(grid.width).toBe(width);
      expect(grid.height).toBe(height);
      expect(grid.nodes).toHaveLength(height);

      for (let i = 0; i < height; i++) {
        expect(grid.nodes[i]).toHaveLength(width);
      }
    });
  });
});

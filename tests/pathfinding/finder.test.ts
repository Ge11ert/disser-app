import Grid from '../../src/pathfinding/core/grid';
import AStarFinder from '../../src/pathfinding/finder/a-star-finder';
import scenarios from './path-test-scenarios';

interface IFinder {
  findPath(sX: number, sY: number, eX: number, eY: number, grid: any): number[][];
}

type testPathOpts = { name: string, finder: IFinder, optimal: boolean };

function testPath(opts: testPathOpts) {
  const { name, finder, optimal } = opts;

  describe(name, () => {
    const testScenario = (
      scenId: string,
      startX: number, startY: number,
      endX: number, endY: number,
      grid: Grid,
      expectedLength: number,
    ) => {
      it(`should solve maze ${scenId}`, () => {
        const path = finder.findPath(startX, startY, endX, endY, grid);
        if (optimal) {
          expect(path).toHaveLength(expectedLength);
        } else {
          expect(path[0]).toEqual([startX, startY]);
          expect(path[path.length - 1]).toEqual([endX, endY]);
        }
      });
    };

    // Load all the scenarios and test against the finder.
    scenarios.forEach(scen => {
      const { matrix } = scen;
      const height = matrix.length;
      const width = matrix[0].length;
      const grid = new Grid(width, height, matrix);

      testScenario(
        scen.id,
        scen.startX, scen.startY,
        scen.endX, scen.endY,
        grid,
        scen.expectedLength,
      );
    });
  });
}

function testPaths(...tests: testPathOpts[]) {
  tests.forEach(test => {
    testPath(test);
  });
}

testPaths({
  name: 'AStart',
  finder: new AStarFinder(),
  optimal: true,
});

import Heap from 'heap';
import { backtrace } from '../core/util';
import Grid from '../core/grid';
import heuristic, {Heuristic} from '../core/heuristic';
import DiagonalMovement from '../core/diagonal-movement';
import GridNode from "../core/node";

type finderOptions = Partial<{
  allowDiagonal: boolean,
  dontCrossCorners: boolean,
  diagonalMovement: DiagonalMovement,
  heuristic: Heuristic,
  weight: number,
}>

/**
 * A* path-finder. Based upon https://github.com/bgrins/javascript-astar
 */
export default class AStarFinder {
  allowDiagonal: boolean;
  dontCrossCorners: boolean;
  heuristic: Heuristic;
  weight: number;
  diagonalMovement: DiagonalMovement;

  constructor(opt: finderOptions = {}) {
    this.allowDiagonal = !!opt.allowDiagonal;
    this.dontCrossCorners = !!opt.dontCrossCorners;
    this.heuristic = opt.heuristic || heuristic.manhattan;
    this.weight = opt.weight || 1;
    this.diagonalMovement = opt.diagonalMovement || fallbackDiagonalMovement(opt);

    // When diagonal movement is allowed the manhattan heuristic is not
    //admissible. It should be diagonal instead
    if (this.diagonalMovement === DiagonalMovement.NEVER) {
      this.heuristic = opt.heuristic || heuristic.manhattan;
    } else {
      this.heuristic = opt.heuristic || heuristic.diagonal;
    }
  }

  findPath(startX: number, startY: number, endX: number, endY: number, grid: Grid): number[][] {
    const openList = new Heap((nodeA: GridNode, nodeB: GridNode) => {
      return nodeA.f - nodeB.f;
    });
    const startNode = grid.getNodeAt(startX, startY);
    const endNode = grid.getNodeAt(endX, endY);
    const { diagonalMovement } = this;
    let currentNode: GridNode;

    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;

    // while the open list is not empty
    while (!openList.empty()) {
      // pop the position of node which has the minimum `f` value.
      currentNode = openList.pop();
      currentNode.closed = true;

      // if reached the end position, construct the path and return it
      if (currentNode === endNode) {
        return backtrace(endNode);
      }

      // get neighbours of the current node
      const neighbors = grid.getNeighbors(currentNode, diagonalMovement);

      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];

        if (neighbor.closed) {
          continue;
        }

        const ng = currentNode.g + this.getNeighborG(currentNode, neighbor);

        // check if the neighbor has not been inspected yet, or
        // can be reached with smaller cost from the current node
        if (!neighbor.opened || ng < neighbor.g) {
          neighbor.g = ng;
          neighbor.h = neighbor.h || this.getNeighborH(neighbor, endNode);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = currentNode;

          if (!neighbor.opened) {
            openList.push(neighbor);
            neighbor.opened = true;
          } else {
            // the neighbor can be reached with smaller cost.
            // Since its f value has been updated, we have to
            // update its position in the open list
            openList.updateItem(neighbor);
          }
        }
      }  // end for each neighbor
    } // end while not open list empty

    // fail to find the path
    return [];
  }

  getNeighborG(currentNode: GridNode, neighborNode: GridNode): number {
    const fromCurrentToNeighbor = currentNode.distanceTo(neighborNode);
    return fromCurrentToNeighbor.distance;
  }

  getNeighborH(neighborNode: GridNode, endNode: GridNode): number {
    const fromNeighborToEnd = neighborNode.distanceTo(endNode);
    return this.heuristic(fromNeighborToEnd.dx, fromNeighborToEnd.dy);
  }
}

function fallbackDiagonalMovement({ allowDiagonal, dontCrossCorners }: finderOptions): DiagonalMovement {
  if (!allowDiagonal) {
    return DiagonalMovement.NEVER;
  } else {
    if (dontCrossCorners) {
      return DiagonalMovement.ONLY_WHEN_NO_OBSTACLES;
    } else {
      return DiagonalMovement.IF_AT_MOST_ONE_OBSTACLE;
    }
  }
}

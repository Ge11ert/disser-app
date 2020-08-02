import GridNode from './node';

export function backtrace(node: GridNode): number[][] {
  const path: number[][] = [[
    node.x,
    node.y,
    node.distanceFromNeighbourInMiles,
    node.fuelBurnFromNeighbourInKgs,
    node.timeFromNeighbourInHours,
    node.windAtNode,
  ]];
  let currentNode = { ...node };

  while (currentNode.parent) {
    currentNode = currentNode.parent;
    path.push([
      currentNode.x,
      currentNode.y,
      currentNode.distanceFromNeighbourInMiles,
      currentNode.fuelBurnFromNeighbourInKgs,
      currentNode.timeFromNeighbourInHours,
      currentNode.windAtNode,
    ]);
  }

  return path.reverse();
}

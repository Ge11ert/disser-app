import GridNode from './node';

export function backtrace(node: GridNode): number[][] {
  const path: number[][] = [[node.x, node.y]];
  let currentNode = { ...node };

  while (currentNode.parent) {
    currentNode = currentNode.parent;
    path.push([currentNode.x, currentNode.y]);
  }

  return path.reverse();
}

import GridNode from '../core/node';

export default class FinderNode extends GridNode {
  g: number = 0;
  f: number = 0;
  h: number = 0;
  opened: boolean = false;
  closed: boolean = false;

  static createFromGridNode(gridNode: GridNode) {
    return new FinderNode(gridNode.x, gridNode.y, gridNode.walkable, gridNode.parent);
  }
}

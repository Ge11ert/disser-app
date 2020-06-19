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

  constructor(
    public x: number,
    public y: number,
    public walkable: boolean = true,
    public parent?: GridNode|undefined,
  ) {}
}

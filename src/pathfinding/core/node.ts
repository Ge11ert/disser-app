/**
 * A node in grid.
 * This class holds some basic information about a node and custom
 * attributes may be added, depending on the algorithms' needs.
 */
export default class GridNode {
  constructor(
    public x: number,
    public y: number,
    public walkable: boolean = true,
    public parent?: GridNode|undefined,
  ) {}
}

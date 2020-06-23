export type Heuristic = (dx: number, dy: number) => number;

/**
 * @description A collection of heuristic functions.
 */
const heuristicCollection = {

  /**
   * Manhattan distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} dx + dy
   */
  manhattan: function(dx:number, dy: number) {
    return dx + dy;
  },

  /**
   * Euclidean distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} sqrt(dx * dx + dy * dy)
   */
  euclidean: function(dx:number, dy: number) {
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Octile distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} sqrt(dx * dx + dy * dy) for grids
   */
  octile: function(dx:number, dy: number) {
    const F = Math.SQRT2 - 1;
    return (dx < dy) ? F * dx + dy : F * dy + dx;
  },

  // http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html#diagonal-distance
  diagonal: function(dx: number, dy: number) {
    const D = 1;
    const D2 = Math.SQRT2;
    return (dx > dy) ? D * (dx - dy) + D2 * dy : D * (dy - dx) + D2 * dx;
  },

  /**
   * Chebyshev distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} max(dx:number, dy: number)
   */
  chebyshev: function(dx:number, dy: number) {
    return Math.max(dx, dy);
  }
}

export default heuristicCollection;

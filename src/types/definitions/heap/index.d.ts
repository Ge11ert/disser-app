declare module 'heap' {
  type compareFunction = (a: any, b: any) => number;
  class Heap {
    constructor(cmp: compareFunction);

    push<T>(x: T): void;

    pop<T>(): T;

    empty(): boolean;

    updateItem<T>(x: T): void;
  }

  export default Heap;
}

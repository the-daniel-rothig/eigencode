export default class ReduceResult {
  constructor(array) {
    this.array = array;
  }

  static empty = () => new ReduceResult([])

  static single = (obj) => new ReduceResult([obj])

  static multiple = (...args) => args.length === 1 && Array.isArray(args[0]) ? new ReduceResult(args[0]) : new ReduceResult([...args])

  static cast(obj) {
    if (obj instanceof ReduceResult) {
      return obj;
    }

    if (obj === undefined) {
      return new ReduceResult([])
    }

    if (Array.isArray(obj)) {
      return new ReduceResult(obj)
    }

    return new ReduceResult([obj])
  }

  static flatten(arrayOfArrays) {
    const array = arrayOfArrays instanceof ReduceResult
      ? arrayOfArrays.array
      : arrayOfArrays;

    if (!Array.isArray(array)) {
      return array;
    }

    let res = [];
    array.forEach(arr => {
      // shallow should be sufficient since this is called recursively
      if (arr instanceof ReduceResult) {
        res = [...res, ...arr.array];
      } else if (arr !== undefined) {
        res = [...res, arr];
      }
    })
    return res
  }
}

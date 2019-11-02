import { logOnce } from "eigencode-shared-utils";

export default class ReducerFunction {
  constructor(reduce, finalTransform = x => x) {
    if (typeof reduce !== 'function') {
      throw `ReducerFunction error: ${obj} is not a function`
    }
    this.reduce = reduce;
    this.finalTransform = finalTransform;
  }

  static cast = obj => {
    if (obj instanceof ReducerFunction) {
      return obj;
    }
    return new ReducerFunction(obj);
  }

  static single = obj => new ReducerFunction(obj, x => {
    if (Array.isArray(x)) {
      if (x.length > 1) {
        logOnce("ReducerFunction.single returned multiple results; only the first will be returned");
      }
      return x[0]
    }
    return x;
  });
} 
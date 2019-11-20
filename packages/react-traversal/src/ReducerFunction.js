import { logOnce } from "eigencode-shared-utils";

const defaultShouldUpdate = (one, two) => one !== two;

export default class ReducerFunction {
  constructor(reduce, shouldUpdate = defaultShouldUpdate, getContents, finalTransform = x => x) {
    if (typeof reduce !== 'function') {
      throw `ReducerFunction error: ${reduce} is not a function`
    }
    this.reduce = reduce;
    this.finalTransform = finalTransform;
    this.shouldUpdate = shouldUpdate;
    this.getContents = getContents;
  }

  static cast = obj => {
    if (obj instanceof ReducerFunction) {
      return obj;
    }
    return new ReducerFunction(obj);
  }

  static single = (obj, shouldUpdate = defaultShouldUpdate, getContents) => new ReducerFunction(obj, shouldUpdate, getContents, x => {
    if (Array.isArray(x)) {
      if (x.length > 1) {
        logOnce("ReducerFunction.single returned multiple results; only the first will be returned");
      }
      return x[0]
    }
    return x;
  });
} 
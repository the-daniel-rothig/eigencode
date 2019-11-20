import { logOnce } from "eigencode-shared-utils";

const defaultShouldUpdate = (one, two) => one !== two;
const defaultFinalTransform = x => x;

export default class ReducerFunction {
  constructor(options) {
    const saneOptions = typeof options === "function" ? {reduce: options} : options;

    this.reduce = saneOptions.reduce;
    this.finalTransform = saneOptions.finalTransform || defaultFinalTransform;
    this.shouldUpdate = saneOptions.shouldUpdate || defaultShouldUpdate;
    this.getContents = saneOptions.getContents;

    if (typeof this.reduce !== 'function') {
      throw `ReducerFunction error: reduce is not a function`
    }
    if (typeof this.finalTransform !== 'function') {
      throw `ReducerFunction error: finalTransform is not a function`
    }
    if (typeof this.shouldUpdate !== 'function') {
      throw `ReducerFunction error: shouldUpdate is not a function`
    }
    if (!!this.getContents && typeof this.getContents !== 'function') {
      throw `ReducerFunction error: getContents is not a function`
    }
  }

  static cast = obj => {
    if (obj instanceof ReducerFunction) {
      return obj;
    }
    return new ReducerFunction(obj);
  }
} 
const defaultShouldUpdate = (one, two) => one !== two;
const defaultFinalTransform = x => x;

class CustomRenderFunction {
  constructor(options) {
    const saneOptions = typeof options === "function" ? {reduce: options} : options;

    this._reducerFragments = [];
    this._getContentsFragments = [];

    this._reduce = saneOptions.reduce;
    this.finalTransform = saneOptions.finalTransform || defaultFinalTransform;
    this.shouldUpdate = saneOptions.shouldUpdate || defaultShouldUpdate;
    this._getContents = saneOptions.getContents;
    this.suppressWarnings = !!saneOptions.suppressWarnings;

    if (typeof this._reduce !== 'function') {
      throw new Error('CustomRenderFunction error: reduce is not a function')
    }
    if (typeof this.finalTransform !== 'function') {
      throw new Error('CustomRenderFunction error: finalTransform is not a function')
    }
    if (typeof this.shouldUpdate !== 'function') {
      throw new Error('CustomRenderFunction error: shouldUpdate is not a function')
    }
    if (!!this._getContents && typeof this._getContents !== 'function') {
      throw new Error('CustomRenderFunction error: getContents is not a function')
    }
  }

  reduce(options) {
    const { element } = options;
    for (let i = this._reducerFragments.length - 1; i >= 0; i--) {
      const { predicate, callback } = this._reducerFragments[i];
      if(predicate(element)) {
        return callback(options)
      }
    }
    return this._reduce(options);
  }

  addReducerRule(typeOrSymbol, callback) {
    const predicate = element => element && element.type && (element.type === typeOrSymbol || element.type[typeOrSymbol]);
    
    this._reducerFragments.push({predicate, callback});
  }

  getContents(options) {
    const { element } = options;
    
    for (let i = this._getContentsFragments.length - 1; i >= 0; i--) {
      const { predicate, callback } = this._getContentsFragments[i];
      if(predicate(element)) {
        return callback(options)
      }
    }
    if (this._getContents) {
      return this._getContents(options);
    } else {
      return options.defaultReturn;
    }
  }

  addGetContentsRule(typeOrSymbol, callback) {
    const predicate = element => element && element.type && (element.type === typeOrSymbol || element.type[typeOrSymbol]);
    
    this._getContentsFragments.push({predicate, callback});
  }
};

CustomRenderFunction.cast = obj => {
  if (obj instanceof CustomRenderFunction) {
    return obj;
  }
  return new CustomRenderFunction(obj);
}
 
export default CustomRenderFunction
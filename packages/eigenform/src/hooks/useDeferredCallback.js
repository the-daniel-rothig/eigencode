import { useState, useEffect, useCallback } from 'react';
import isEqual from 'lodash/isEqual';

const uninitialised = Symbol('eigenform.uninitialised');

export default (cb, deps) => {
  const [state, setState] = useState(uninitialised);
  const [promisesToFlush, setPromisesToFlush] = useState([]);
  
  // empty the promises when the dependencies change - because they are to be considered stale.
  useEffect(() => () => setPromisesToFlush([]), deps)

  if (state !== uninitialised && promisesToFlush.length) {
    promisesToFlush.forEach(({ok, reject, args}) => {
      try {
        const result = cb(state, ...args)
        ok(result);
      } catch (e) {
        reject(e);
      }
    });
    setPromisesToFlush([]);
  }

  const curriedCallback = useCallback((...args) => {    
    return new Promise((ok, reject) => {
      setPromisesToFlush([...promisesToFlush, {ok, reject, args}]);
    })
  }, [state, cb, promisesToFlush])

  const get = useCallback(() => state === uninitialised ? undefined : state, [state]);
  const set = useCallback(newVal =>{
    if (state === uninitialised || isEqual(state.describe(), newVal.describe())) {
      setState(newVal);
    }
  }, [state]);

  return [curriedCallback, get, set];
}
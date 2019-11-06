import { useRef, useEffect } from 'react';

const uninitialised = Symbol('eigenform.uninitialised');

export default (cb, deps) => {
  const ref = useRef(uninitialised);
  const promisesToFlush = useRef([]);

  // empty the promises when the dependencies change - because they are to be considered stale.
  useEffect(() => () => promisesToFlush.current = [], deps)

  const curriedCallback = (...args) => {
    if (ref.current !== uninitialised) {
      return cb(ref.current, ...args)
    } else {
      return new Promise((ok, reject) => {
        promisesToFlush.current.push({ok, reject, args});
      })
    }
  }

  const set = newValue => {
    ref.current = newValue;
    promisesToFlush.current.forEach(({ok, reject, args}) => {
      try {
        const result = cb(ref.current, ...args)
        ok(result);
      } catch (e) {
        reject(e);
      }
    });
    promisesToFlush.current = [];
  }

  const val = ref.current === uninitialised ? undefined : ref.current;

  return [curriedCallback, val, set];
}
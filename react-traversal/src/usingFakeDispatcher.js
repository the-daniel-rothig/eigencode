import React from 'react';
import { logOnce } from 'eigencode-shared-utils';

// cooking with gas!
const { ReactCurrentDispatcher } = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

const notImplemented = (name) => {
  logOnce(`WARNING: use of ${name} is not supported for static traversal, and its effects will be ignored.`)
}

export const getContextFromStack = (contextStack, ctx) => {
  if (!ctx) { 
    return null;
  } 

  const providerType = 
    ctx.Provider ? ctx.Provider :
    ctx._context ? ctx._context.Provider : 
    null;

  if (!providerType) {
    return null;
  }
  for(var i = contextStack.length-1; i >= 0; i--) {
    if (contextStack[i].type === providerType) {
      return contextStack[i].value;
    }
  }
  return null;
}

const unbox = x => x

const makeFakeDispatcher = (contextStack) => {
  const rebuild = { rebuild: false };
  const _rebuild = (r) => {
    if (r !== undefined) {
      rebuild.current = !!r;
    }

    return rebuild.current;
  }

  const stateStack = [];
  const stateIndex = { current: -1 };
  const _rewind = () => {
    stateIndex.current = -1;
    _rebuild(false);
  }

  const registerState = (x, getNextState) => {
    stateIndex.current = stateIndex.current+1;
    const idx = stateIndex.current;
    if (stateStack.length - 1  < idx) {
      stateStack.push(x);
    }
    const val = stateStack[idx];
    const setVal = (...args) => {
      const y = getNextState(stateStack[idx], ...args)
      if (stateStack[idx] === y) {
        return;
      }
      stateStack[idx] = y;
      _rebuild(true);
    }
    return [val, setVal];
  }

  return {
    readContext: ctx => getContextFromStack(contextStack, ctx),
    useCallback: unbox,
    useContext: ctx => getContextFromStack(contextStack, ctx),
    useEffect: () => notImplemented('useEffect'),
    useImperativeHandle: () => notImplemented('useImperativeHandle'),
    useLayoutEffect: () => notImplemented('useLayoutEffect'),
    useMemo: unbox,
    useReducer: (reducer, initialState) => registerState(initialState, reducer),
    useRef: (initial) => {
      const ref = {current: initial};
      return ref;
    },
    useState: x => registerState(x, (oldState, newState) => newState),
    useDebugValue: () => notImplemented('useDebugValue'),
    useResponder: () => notImplemented('useResponder'),
    useDeferredValue: () => notImplemented('useDeferredValue'),
    useTransition: () => notImplemented('useTransition'),
    _rebuild,
    _rewind
  };
}

// SYNC ONLY!
export default (contextStack, cb) => {
  const fake = makeFakeDispatcher(contextStack)
  const original = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = fake;
  try {
    return cb(fake);
  }
  finally {
    ReactCurrentDispatcher.current = original;
  }
}
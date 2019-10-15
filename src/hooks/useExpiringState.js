import { useState, useRef, useCallback } from 'react';

export default (initialState) => {
  const ref = useRef(initialState);
  const [state, pureSetState] = useState(initialState);

  const setState = useCallback((newState) => {
    ref.current = newState;
    pureSetState(newState);
  }, [pureSetState])

  const isStale = () => state !== ref.current;

  return [state, setState, isStale];
}
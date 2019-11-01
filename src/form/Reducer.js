import React from 'react';
import Substituting from '../styled/Substituting';
import debounce from 'lodash/debounce';
import logOnce from '../util/logOnce';

const ensurePromise = obj => obj && typeof obj.then === "function"
  ? obj
  : Promise.resolve(obj)

const mapElement = (initialReduce, onFinish) => ({element, memo, getContext, siblingIndex, siblingCount: _siblingCount}) => {
  const idx = siblingIndex || 0;
  const siblingCount = _siblingCount || 1;
  const root = memo ? memo.root : element;
  const reduce = memo && memo.reduce || initialReduce;  
    
  if (!element || typeof element !== "object" || (Array.isArray(element) && element.length === 0)) {  
    const promise = reduce({unbox: () => undefined, element, getContext, isRoot: root === element, isLeaf: true})
    ensurePromise(promise).then(res => {
      if (memo) {
        memo.returnValue(res, idx, siblingCount)
      } else {
        onFinish(res)
      }
    })
    return [element, {root}];
  }    
  
  const childrenValues = {}

  let newReduce = reduce;
  let newElement = element;
  const resolveUnboxPromises = [];
  const unbox = (el, reduceOverride) => {
    if (!!el) {
      logOnce('substituting elements via unbox in Reducer is not currently supported.\n' +
              '     The element will be left unaltered. If you do want to change the UI,\n' +
              '     use a Substituting element within the Reducer element', 'info');
    }
    newReduce = reduceOverride || newReduce;
    return new Promise(ok => {
      resolveUnboxPromises.push(ok);
    })
  }
  
  const reducePromise = reduce({unbox, element, getContext, isRoot: element === root, isLeaf: false});

  ensurePromise(reducePromise).then(res => {
    if (memo) {
      memo.returnValue(res, idx, siblingCount);
    } else {
      onFinish(res)
    }
  });
  
  const returnValue = (val, index, childrenCount) => {
    childrenValues[index] = val
    // todo: what if a child disappears, eg. becomes null? is that possible w/o parent re-evaluation?
    if (Object.keys(childrenValues).length === childrenCount) {
      const res = Object.values(childrenValues);
      resolveUnboxPromises.forEach(resolve => resolve(res));
    }
  }
  return [newElement, {returnValue, reduce: newReduce, root}]
}

const Reducer = ({children, reduce, onFinish}) => {
  const debouncedOnFinish = React.useCallback(
    debounce(onFinish, 100, {leading:false}),
    [onFinish]
  );

  // we want to flush when Reducer has mounted, but in the next render cycle
  // so wrap the debounce flush in a SECOND debounce, but with a shorter timeout
  const flushDebounce = React.useCallback(
    debounce(() => debouncedOnFinish.flush(), 0, {leading: false})
  )

  React.useEffect(() => {
    flushDebounce();
  })

  const map = mapElement(reduce, debouncedOnFinish);
  // wrap children in fragment to ensure there is a root-level element to be reduced.
  return (
    <Substituting mapElement={map}>
      <>{children}</>
    </Substituting>
  )
}

export default Reducer;

import React from 'react';
import Substituting from './Substituting';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { logOnce } from 'eigencode-shared-utils';

const mapElement = (initialReducerFunction, onFinish) => ({element, memo, getContext, siblingIndex, siblingCount: _siblingCount}) => {
  const idx = siblingIndex || 0;
  const siblingCount = _siblingCount || 1;
  const root = memo ? memo.root : element;
  const reducerFunction = (memo && memo.reducerFunction) || initialReducerFunction;  
    
  if (!element || typeof element !== "object" || (Array.isArray(element) && element.length === 0)) {  
    const unbox = () => unbox;
    let res = reducerFunction.reduce({unbox , element, getContext, isRoot: root === element, isLeaf: true})
    
    if (res === unbox) res = [];

    if (memo) {
      memo.returnValue(res, idx, siblingCount)
    } else {
      onFinish(reducerFunction.finalTransform(res))
    }
    return [element, {root}];
  }    
  
  const childrenValues = {}

  let newReducerFunction = reducerFunction;
  let newElement = element;
  let resolveCb = null;
  const unbox = (el, reduceOverride, cb) => {
    if (!!el) {
      logOnce('substituting elements via unbox in Reducer is not currently supported.\n' +
              '     The element will be left unaltered. If you do want to change the UI,\n' +
              '     use a Substituting element within the Reducer element', 'info');
    }
    newReducerFunction = reduceOverride || newReducerFunction;
    resolveCb = cb;
    return unbox;
  }
  
  const reduceResult = reducerFunction.reduce({unbox, element, getContext, isRoot: element === root, isLeaf: false});
  
  const returnValue = (val, index, childrenCount) => {
    const hasOldValue = Object.keys(childrenValues).includes(`${index}`);
    const oldValue = childrenValues[index];
    
    childrenValues[index] = val
    if (Object.keys(childrenValues).length < childrenCount) {
      return;
    }

    const res = Object.values(childrenValues);
    let rtnValue = reduceResult;
    if (reduceResult === unbox) {
      rtnValue = resolveCb ? resolveCb(res) : res //todo: flatten
    }

    if (
      hasOldValue && 
      typeof reducerFunction.shouldUpdate === "function" && 
      !reducerFunction.shouldUpdate(oldValue, rtnValue)
    ) {
      // stop bubbling up
      return;
    }
    
    if (memo) {
      memo.returnValue(rtnValue, idx, siblingCount);
    } else {
      onFinish(reducerFunction.finalTransform(rtnValue))
    }
  }
  return [newElement, {returnValue, reducerFunction: newReducerFunction, root}]
}

const Reducer2 = ({children, reducerFunction, onFinish}) => {
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

  const map = mapElement(reducerFunction, debouncedOnFinish);

  // ensure there is a root-level element to be reduced to.
  const c = React.Children.toArray(children).length === 1 ?
    children : <>{children}</>;

  return (
    <Substituting mapElement={map}>
      {c}
    </Substituting>
  )
}

export default Reducer2;

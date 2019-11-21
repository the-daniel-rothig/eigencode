import React from 'react';
import Substituting from './Substituting';

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
      onFinish(reducerFunction.finalTransform([res]))
    }
    return [element, {root}];
  }    
  
  const childrenValues = {}

  let newReducerFunction = reducerFunction;
  let newElement = element;
  let resolveCb = null;
  const unbox = (...args) => {
    switch (args.length) {
      case 1:
        resolveCb = args[0]
        break;
      case 2:
        newReducerFunction = args[0];
        resolveCb = args[1];
        break;
      default: //do nothing
    }
    
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
      onFinish(reducerFunction.finalTransform([rtnValue]))
    }
  }
  return [newElement, {returnValue, reducerFunction: newReducerFunction, root}]
}

const Reducer = ({children, reducerFunction, onFinish}) => {
  const map = mapElement(reducerFunction, onFinish);

  // ensure there is a root-level element to reduce to
  const childrenArray = React.Children.toArray(children)
  const c = childrenArray.length === 1 ? childrenArray[0] : <>{children}</>

  return (
    <Substituting mapElement={map}>
      <>{c}</>
    </Substituting>
  )
}

export default Reducer;

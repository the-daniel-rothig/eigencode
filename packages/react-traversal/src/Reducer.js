import React from 'react';
import Substituting from './Substituting';

const makeValueMap = () => {
  const map = new Map()
  const toKey = indexOrElement => {
    return (indexOrElement && indexOrElement.key) || indexOrElement;
  }
  const notSet = Symbol("eigencode.notSet");

  const get = key => {
    return map.has(key) ? map.get(key) : notSet;
  }

  const setOrGet = (key, value) => {
    const existing = get(key);
    if (existing === notSet) {
      map.set(key, value);
      return value;
    }
    return existing;
  }

  return {
    has: indexOrElement => map.has(toKey(indexOrElement)),
    get: indexOrElement => get(toKey(indexOrElement)),
    set: (indexOrElement, value) => map.set(toKey(indexOrElement), value),
    setOrGet: (indexOrElement, value) => setOrGet(toKey(indexOrElement), value),
    notSet
  };
}

const mapElement = (initialReducerFunction, onFinish) => ({element, memo, getContext, siblingIndex}) => {
  const idx = siblingIndex || 0;
  const root = memo ? memo.root : element;
  const reducerFunction = (memo && memo.reducerFunction) || initialReducerFunction;  
    
  if (!element || typeof element !== "object" || (Array.isArray(element) && element.length === 0)) {  
    const unbox = () => unbox;
    let res = reducerFunction.reduce({unbox, element, getContext, isRoot: root === element, isLeaf: true})
    
    if (res === unbox) res = [];

    if (memo) {
      memo.returnValue(res, idx)
    } else {
      onFinish(reducerFunction.finalTransform([res]))
    }
    return [element, {root}];
  }

  const freshMap = {
    values: makeValueMap(),
    children: makeValueMap()
  };
  
  const childMap = memo 
    ? memo.childrenMaps.setOrGet(element, freshMap) 
    : freshMap;

  const childrenValues = childMap.values;

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
  
  const returnValue = (val, indexOrElement) => {
    const oldValue = childrenValues.get(indexOrElement);
    const hasOldValue = oldValue !== childrenValues.notSet;
    
    childrenValues.set(indexOrElement, val)
    
    if (
      !hasOldValue || 
      typeof reducerFunction.shouldUpdate !== "function" || 
      reducerFunction.shouldUpdate(oldValue, val)
    ) {
      resolveIfComplete();
    }
  }

  let childrenArray = undefined;

  const onChildrenArrayResolved = newChildrenArray => {
    const newKeys = newChildrenArray.filter(x => x && x.key).map(x => x.key);
    const oldKeys = childrenArray ? childrenArray.filter(x => x && x.key).map(x => x.key) : [];
    const keysMatch = newKeys.length === oldKeys.length && !oldKeys.find((k, i) => k !== newKeys[i]);

    const hasChanged = (
      childrenArray !== undefined && 
      ( childrenArray.length !== newChildrenArray.length || !keysMatch )
    );

    childrenArray = newChildrenArray;
    if (hasChanged) {
      resolveIfComplete()
    }
  }

  const resolveIfComplete = () => {
    const res = childrenArray.map((c, i) => {
      const indexOrElement = typeof c === "object" && c !== null ? c : i;
      return childrenValues.get(indexOrElement)
    });

    if (res.includes(childrenValues.notSet)) {
      // incomplete, so don't return yet
      return;
    }

    let rtnValue = reduceResult;
    if (reduceResult === unbox) {
      rtnValue = resolveCb ? resolveCb(res) : res //todo: flatten
    }
    
    if (memo) {
      memo.returnValue(rtnValue, element);
    } else {
      onFinish(reducerFunction.finalTransform([rtnValue]))
    }
  }

  const childrenMaps = childMap.children;

  return [newElement, {returnValue, reducerFunction: newReducerFunction, root, childrenMaps}, {onChildrenArrayResolved}];
}

const Reducer = ({children, reducerFunction, onFinish}) => {
  const map = React.useMemo(() => mapElement(reducerFunction, onFinish), [reducerFunction, onFinish]);

  return (
    <Substituting mapElement={map}>
      <>{children}</>
    </Substituting>
  )
}

export default Reducer;

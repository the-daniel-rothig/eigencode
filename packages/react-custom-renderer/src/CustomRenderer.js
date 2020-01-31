import React from 'react';
import Substitute from 'react-substitute';

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

const mapElement = (initialCustomRenderFunction, onFinish) => ({element, memo, getContext, siblingIndex}) => {
  const idx = siblingIndex || 0;
  const root = memo ? memo.root : element;
  const customRenderFunction = (memo && memo.customRenderFunction) || initialCustomRenderFunction;  
    
  if (!element || typeof element !== "object" || (Array.isArray(element) && element.length === 0)) {  
    const unbox = () => unbox;
    let res = customRenderFunction.reduce({unbox, element, getContext, isRoot: root === element, isLeaf: true})
    
    if (res === unbox) res = [];

    if (memo) {
      memo.returnValue(res, idx)
    } else {
      onFinish(customRenderFunction.finalTransform([res]))
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

  let newCustomRenderFunction = customRenderFunction;
  let newElement = element;
  let resolveCb = null;
  const unbox = (...args) => {
    switch (args.length) {
      case 1:
        resolveCb = args[0]
        break;
      case 2:
        newCustomRenderFunction = args[0];
        resolveCb = args[1];
        break;
      default: //do nothing
    }
    
    return unbox;
  }
  
  const reduceResult = customRenderFunction.reduce({unbox, element, getContext, isRoot: element === root, isLeaf: false});
  
  const returnValue = (val, indexOrElement) => {
    const oldValue = childrenValues.get(indexOrElement);
    const hasOldValue = oldValue !== childrenValues.notSet;
    
    childrenValues.set(indexOrElement, val)
    
    if (
      !hasOldValue || 
      typeof customRenderFunction.shouldUpdate !== "function" || 
      customRenderFunction.shouldUpdate(oldValue, val)
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
      onFinish(customRenderFunction.finalTransform([rtnValue]))
    }
  }

  const childrenMaps = childMap.children;

  return [newElement, {returnValue, customRenderFunction: newCustomRenderFunction, root, childrenMaps}, {onChildrenArrayResolved}];
}

const CustomRenderer = ({children, customRenderFunction, onFinish}) => {
  const map = React.useMemo(() => mapElement(customRenderFunction, onFinish), [customRenderFunction, onFinish]);

  return (
    <Substitute mapElement={map}>
      <>{children}</>
    </Substitute>
  )
}

export default CustomRenderer;

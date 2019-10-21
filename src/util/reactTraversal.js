import React from 'react';
import makeClassInstance from './reactTraversal.makeClassInstance';
import { Exception } from 'handlebars';
import Conditional from '../form/Conditional';
import Multiple from '../form/Multiple';

// cooking with gas!
const { ReactCurrentDispatcher } = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
const originalDispatcher = ReactCurrentDispatcher.current;

const notImplemented = (name) => () => {
  //console.warn(`WARNING: use of ${name} has not been implemented for traversal and its effects will be ignored.`)
}

const notSupported = (name) => {
  throw new Error(`${name} is not currently supported`)
}

const flatten = arrayOfArrays => arrayOfArrays.reduce((agg, curr) => [...agg, ...curr], [])

const getContext = (contextStack, ctx) => {
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

const passThrough = x => x

const makeFakeDispatcher = (contextStack) => ({
  readContext: ctx => getContext(contextStack, ctx),
  useCallback: passThrough,
  useContext: ctx => getContext(contextStack, ctx),
  useEffect: notImplemented('useEffect'),
  useImperativeHandle: notImplemented('useImperativeHandle'),
  useLayoutEffect: notImplemented('useLayoutEffect'),
  useMemo: passThrough,
  useReducer: x => [x, () => {}],
  useRef: passThrough,
  useState: x => [x, () => {}],
  useDebugValue: notImplemented('useDebugValue'),
  useResponder: notImplemented('useResponder'),
});

// SYNC ONLY!
const usingFakeDispatcher = (contextStack, cb) => {
  ReactCurrentDispatcher.current = makeFakeDispatcher(contextStack);
  try {
    return cb();
  }
  finally {
    ReactCurrentDispatcher.current = originalDispatcher;
  }
}

const shouldConstruct = (Component) => {
  return Component && Component.prototype && Component.prototype.isReactComponent;
}

const opaqueTypes = {
  current: [
    React.Fragment,
    React.Suspense,
    Conditional,
    Multiple
  ]
}

function processChild({child, contextStack, traverse}) {
  const saneTraverse = traverse || ((...args) => {
    return args
  });

  const mapToResult = (children, mappingContextStack) => {
    const array = React.Children.toArray(children);
    const res = array.map(innerChild => saneTraverse(innerChild, mappingContextStack));
    return res;
  }

  if (child === null || child === undefined) {
    return [];
  }
  if (child.type && child.type.$$typeof && child.type.$$typeof.toString() === "Symbol(react.provider)") {
    const newContextStack = [...contextStack, {type: child.type, value: child.props.value}];
    const resolvedChildren = mapToResult(child.props.children, newContextStack)
    return resolvedChildren;
  }
  if (child.type && child.type.$$typeof && child.type.$$typeof.toString() === "Symbol(react.context)") {
    const inner = child.props.children(getContext(contextStack, child.type));
    return [saneTraverse(inner, contextStack)];
  }
  if (child.type && child.type.$$typeof && child.type.$$typeof.toString() === "Symbol(react.lazy)") {
    return [child.type._ctor()
      .then(mod => {
        const resolvedElement = React.createElement(
          mod.default,
          Object.assign({ref: child.ref}, child.props));
        return saneTraverse(resolvedElement, contextStack);
      })];
  }
  if (child.$$typeof && child.$$typeof.toString() === "Symbol(react.portal)") {
    const resolvedChildren = mapToResult(child.children, contextStack)
    return resolvedChildren;
  }
  if (typeof child === 'string' || typeof child === 'number') {
    // n.b.!
    //return [child];
    throw new Exception('this shouldnt happen!')
  } 
  if (child.type && opaqueTypes.current.includes(child.type) || typeof child.type === 'string') {
    const resolvedChildren = mapToResult(child.props.children, contextStack)
    return resolvedChildren;
  }
  if (shouldConstruct(child.type)) {
    if (!!child.type.contextTypes) notSupported(`contextTypes properties on classes like ${child.type.name}`)
    if (!!child.type.childContextTypes) notSupported(`childContextTypes properties on classes like ${child.type.name}`)
    
    const inst = makeClassInstance(child, getContext(contextStack, child.type.contextType));
    return [saneTraverse(inst, contextStack)];
  } else {
    let inner = usingFakeDispatcher(contextStack, () => child.type(child.props));
    return [saneTraverse(inner, contextStack)];
  }
}

const makeTraverseFunction = reduce => {
  const traverse = (element, contextStack) => {
    if (!element) { 
      return null;
    }
    if (typeof element === "string" || typeof element === "number") {
      return element;
    }
    const array = processChild({child: element, traverse, contextStack})
    if (array.filter(x => x && typeof x.then === "function").length > 0) {
      return Promise.all(array).then(arr => reduce({array: arr, element}))
    } else {
      return reduce({array, element})
    }
  }

  return traverse;
}

export const traverseDepthFirst = (
  child, 
  reduceChildrenArray 
) => {
  const saneReduceChildrenArray = reduceChildrenArray || (({array, element}) => array);
  const traverse = makeTraverseFunction(saneReduceChildrenArray);
  return traverse(child, []);
}

export const traverseWidthFirst = (
  element,
  handleElement
) => {
  const queue = [{
    child: element,
    contextStack: []
  }];

  while (queue.length > 0) {
    // todo: give a nicer interface with the element type pre-processed
    if (handleElement(queue[0].child)) {
      // interrupt indicated
      return;
    }

    const frame = queue.shift();

    if (!!frame.child.type) {
      const newFrames = processChild(frame);
      newFrames.forEach(newFrame => {
        queue.push({
          child: newFrame[0],
          contextStack: newFrame[1]
        })
      });
    }
  }
}

export const registerOpaqueTypes = (...args) => {
  const saneArgs = 
    args.length > 1 ? args :
    Array.isArray(args[0]) ? args[0] :
    [args[0]];

  opaqueTypes.current = [...opaqueTypes.current, ...saneArgs];
}
import React from 'react';
import makeClassInstance from './reactTraversal.makeClassInstance';
import { Exception } from 'handlebars';
import Conditional from '../form/Conditional';
import Multiple from '../form/Multiple';

// cooking with gas!
const { ReactCurrentDispatcher } = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

const messagesForLogOnce = [];
  
const makeLogOnce = () => {
  const res = (message, level = 'warn') => {
    if (!messagesForLogOnce.includes(message)) {
      messagesForLogOnce.push(message);
      console[level](message);
    }  
  }
  return res;
}

const notImplemented = (name) => {
  return `WARNING: use of ${name} is not supported for static traversal, and its effects will be ignored.`
}

const notSupported = (name) => {
  throw new Error(`${name} is not currently supported`)
}

const REACT___shouldSetTextContent = (type, props) => {
  return type === 'textarea' || type === 'option' || type === 'noscript' || typeof props.children === 'string' || typeof props.children === 'number' || typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML !== null && props.dangerouslySetInnerHTML.__html != null;
}

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

const makeFakeDispatcher = (contextStack, logOnce) => {
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
    readContext: ctx => getContext(contextStack, ctx),
    useCallback: passThrough,
    useContext: ctx => getContext(contextStack, ctx),
    useEffect: () => logOnce(notImplemented('useEffect')),
    useImperativeHandle: () => logOnce(notImplemented('useImperativeHandle')),
    useLayoutEffect: () => logOnce(notImplemented('useLayoutEffect')),
    useMemo: passThrough,
    useReducer: (reducer, initialState) => registerState(initialState, reducer),
    useRef: (initial) => {
      const ref = {current: initial};
      return ref;
    },
    useState: x => registerState(x, (oldState, newState) => newState),
    useDebugValue: () => logOnce(notImplemented('useDebugValue')),
    useResponder: () => logOnce(notImplemented('useResponder')),
    useDeferredValue: () => logOnce(notImplemented('useDeferredValue')),
    useTransition: () => logOnce(notImplemented('useTransition')),
    _rebuild,
    _rewind
  };
}

// SYNC ONLY!
const usingFakeDispatcher = (contextStack, logOnce, cb) => {
  const fake = makeFakeDispatcher(contextStack, logOnce)
  const original = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = fake;
  try {
    return cb(fake);
  }
  finally {
    ReactCurrentDispatcher.current = original;
  }
}

const shouldConstruct = (Component) => {
  return Component && Component.prototype && Component.prototype.isReactComponent;
}

const opaqueTypes = {
  current: [
    React.Fragment,
    React.Suspense,
    // Conditional,
    // Multiple
  ]
}

function processChild({child, contextStack, traverse, logOnce}) {
  const saneTraverse = traverse || ((...args) => {
    return args
  });

  const mapToResult = (children, mappingContextStack) => {
    const array = React.Children.toArray(children);
    const res = array.map((innerChild, i) => saneTraverse(innerChild, mappingContextStack, i));
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

    const { inst, isUpdateRequired, doUpdate } = makeClassInstance(child, getContext(contextStack, child.type.contextType));
    if (inst.shouldComponentUpdate) {
      logOnce(notImplemented('shouldComponentUpdate'))
    }
    let traversed = undefined;
    do {
      doUpdate();
      const inner = inst.render();
      traversed = saneTraverse(inner, contextStack)
    } while (isUpdateRequired())
    
    return [traversed];
  } else {
    let res = usingFakeDispatcher(contextStack, logOnce, (dispatcher) => {
      let traversed = undefined;
      do {
        dispatcher._rewind();
        const inner = child.type(child.props)
        traversed = saneTraverse(inner, contextStack)
      } while(dispatcher._rebuild())

      return [traversed];
    });
    return res;
    //return [saneTraverse(inner, contextStack)];
  }
}

const makeTraverseFunction = (reduce, root) => {
  const logOnce = makeLogOnce()
  const traverse = (element, contextStack, siblingIndex) => {
    if (element === null || element === undefined) { 
      return null;
    }
    if (typeof element === "string" || typeof element === "number") {
      return reduce({unbox: () => [], element, getContext, root, siblingIndex});
    }

    const unbox = (child, reduceOverride) => {
      const saneChild = child ? <>{child}</> : element;
      const newTraverse = reduceOverride ? makeTraverseFunction(reduceOverride, saneChild) : traverse;
      const array = processChild({child: saneChild, traverse: newTraverse, contextStack, logOnce})
      return array.filter(x => x && typeof x.then === "function").length > 0
        ? Promise.all(array)
        : array;
    }

    const getContext1 = ctx => getContext(contextStack, ctx)

    return reduce({unbox, element, getContext: getContext1, root, siblingIndex})
  }

  return traverse;
}

export const traverseDepthFirst = (
  child, 
  reduceChildrenArray
) => {
  const saneReduceChildrenArray = reduceChildrenArray || (({array}) => array);
  const traverse = makeTraverseFunction(saneReduceChildrenArray, child);
  return traverse(child, []);
}

export const traverseWidthFirst = (
  element,
  handleElement
) => {
  const logOnce = makeLogOnce();
  const queue = [{
    child: element,
    contextStack: [],
    logOnce
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
          contextStack: newFrame[1],
          logOnce
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
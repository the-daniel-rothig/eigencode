import React from 'react';
import makeClassInstance from './reactTraversal.makeClassInstance';
import logOnce from './logOnce';
import ReduceResult from './ReduceResult';
import usingFakeDispatcher, { getContextFromStack, inheritContextStack } from './usingFakeDispatcher';
import CustomRenderFunction from './CustomRenderFunction';
import flattenDeep from 'lodash/flattenDeep';

const notSupported = (name) => {
  throw new Error(`${name} is not currently supported`);
}

const shouldConstruct = (Component) => {
  return Component && Component.prototype && Component.prototype.isReactComponent;
}

const opaqueTypes = {
  current: [
    React.Fragment,
    React.Suspense,
  ]
}

function processChild({child, contextStack, getContents, traverse, suppressWarnings}) {
  const saneTraverse = traverse || ((...args) => {
    return args
  });

  const mapToResult = (children, mappingContextStack) => {
    const array = flattenDeep(Array.isArray(children) ? children : [children]) //React.Children.toArray(children);
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
    const inner = child.props.children(getContextFromStack(contextStack, child.type));
    return mapToResult(inner, contextStack);
  }
  if (child.type && child.type.$$typeof && child.type.$$typeof.toString() === "Symbol(react.lazy)") {
    return [child.type._ctor()
      .then(mod => {
        const resolvedElement = React.createElement(
          mod.default,
          Object.assign({ref: child.ref}, child.props));
        return mapToResult(resolvedElement, contextStack)[0];
      })];
  }
  if (child.$$typeof && child.$$typeof.toString() === "Symbol(react.portal)") {
    const resolvedChildren = mapToResult(child.children, contextStack)
    return resolvedChildren;
  }
  if (typeof child === 'string' || typeof child === 'number') {
    throw new Error('this shouldnt happen!');
  } 
  if ((child.type && opaqueTypes.current.includes(child.type)) || typeof child.type === 'string') {
    const resolvedChildren = mapToResult(child.props.children, contextStack)
    return resolvedChildren;
  }
  if (typeof getContents === "function") {
    const defaultReturn = Symbol();
    const customMapped = getContents({element: child, defaultReturn});
    if (customMapped !== defaultReturn) {
      const resolvedChildren = mapToResult(child.props.children, contextStack)
      return resolvedChildren;
    }
  }
  if (shouldConstruct(child.type)) {
    if (!!child.type.contextTypes) notSupported(`contextTypes properties on classes like ${child.type.name}`)
    if (!!child.type.childContextTypes) notSupported(`childContextTypes properties on classes like ${child.type.name}`)

    const { inst, isUpdateRequired, doUpdate } = makeClassInstance(child, getContextFromStack(contextStack, child.type.contextType));
    if (inst.shouldComponentUpdate && !suppressWarnings) {
      logOnce('WARNING: use of shouldComponentUpdate is not supported for static traversal, and its effects will be ignored.');
    }
    let traversed = undefined;
    do {
      doUpdate();
      const inner = inst.render();
      traversed = mapToResult(inner, contextStack)
    } while (isUpdateRequired())
    
    return traversed;
  } else if (typeof child.type === "function") {
    let res = usingFakeDispatcher(contextStack, (dispatcher) => {
      let traversed = undefined;
      do {
        dispatcher._rewind();
        const inner = child.type(child.props)
        traversed = mapToResult(inner, contextStack)
      } while(dispatcher._rebuild())
      // bug: traversed could already be an array
      return traversed;
    }, suppressWarnings);
    return res;
  }
  
  throw new Error(`This shouldn't happen: reactTraversal encountered element ${child}`);
}

const makeTraverseFunction = (reduce, isRoot) => {
  
  const traverse = (element, contextStack) => {
    const getContext = ctx => getContextFromStack(contextStack, ctx)
    
    if (!element || typeof element !== "object" || (Array.isArray(element) && element.length === 0)) {
      // users can pass in non-renderables such as empty arrays or booleans. Sanitise those away 
      const saneElement = ['number', 'string'].includes(typeof element) ? element : undefined;
      const unbox = () => unbox;
      let reduceResult = reduce.reduce({unbox, element: saneElement, getContext, isRoot: isRoot(element), isLeaf: true});
      if (reduceResult === unbox) reduceResult = undefined;
      return reduceResult && typeof reduceResult.then === "function"
        ? reduceResult.then(res => ReduceResult.cast(res))
        : ReduceResult.cast(reduceResult);
    }

    const unbox = (...args) => {
      let callback = null, reduceOverride = null;
      switch (args.length) {
        case 1:
          callback = args[0];
          break;
        case 2:
          reduceOverride = args[0];
          callback = args[1];
          break;
        default: // do nothing
      }
      
      if (reduceOverride) {
        /*  
          a little wrapper to ensure `element` gets 
          re-evaluated with the override - the fragment 
          is immediately discarded 
        */
        const saneChild = <>{element}</>;
      
        const newIsRoot = e => e === element;
        const saneOverride = CustomRenderFunction.cast(reduceOverride)
        const newTraverse = makeTraverseFunction(saneOverride, newIsRoot);
        const array = processChild({child: saneChild, traverse: newTraverse, getContents: (...args) => saneOverride.getContents(...args), contextStack, suppressWarnings: saneOverride.suppressWarnings});
        
        const childrenResult = array.filter(x => x && typeof x.then === "function").length > 0
          ? Promise.all(array).then(arr => saneOverride.finalTransform(ReduceResult.flatten(arr)))
          : saneOverride.finalTransform(ReduceResult.flatten(array));
        return callback ? callback(childrenResult) : childrenResult;
      } else {
        const array = processChild({child: element, traverse, getContents: (...args) => reduce.getContents(...args), contextStack, suppressWarnings: reduce.suppressWarnings })

        const childrenResult = array.filter(x => x && typeof x.then === "function").length > 0
          ? Promise.all(array).then(arr => ReduceResult.flatten(arr))
          : ReduceResult.flatten(array);

        return callback ? callback(childrenResult): childrenResult;
      }
    }

    const reduceResult = reduce.reduce({unbox, element, getContext, isRoot: isRoot(element), isLeaf: false})

    return reduceResult && typeof reduceResult.then === "function"
      ? reduceResult.then(res => ReduceResult.cast(res))
      : ReduceResult.cast(reduceResult);
  }

  return traverse;
}

export const traverseDepthFirst = (
  child, 
  reduceChildrenArray
) => {
  const saneReduceChildrenArray = CustomRenderFunction.cast(reduceChildrenArray || (({array}) => array));
  const traverse = makeTraverseFunction(saneReduceChildrenArray, e => e === child);
  const contextStack = inheritContextStack();
  const res = traverse(child, contextStack);
  return res && typeof res.then === "function"
    ? res.then(arr => saneReduceChildrenArray.finalTransform(ReduceResult.flatten(arr)))
    : saneReduceChildrenArray.finalTransform(ReduceResult.flatten(res));
}
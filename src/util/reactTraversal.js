import React from 'react';
import makeClassInstance from './reactTraversal.makeClassInstance';
import logOnce from './logOnce';
import ReduceResult from './ReduceResult';
import usingFakeDispatcher, { getContextFromStack } from './usingFakeDispatcher';
import ReducerFunction from '../reduces/ReducerFunction';

const notSupported = (name) => {
  throw `${name} is not currently supported`
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

function processChild({child, contextStack, traverse}) {
  const saneTraverse = traverse || ((...args) => {
    return args
  });

  const mapToResult = (children, mappingContextStack) => {
    const array = Array.isArray(children) ? children : [children] //React.Children.toArray(children);
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
    throw 'this shouldnt happen!'
  } 
  if (child.type && opaqueTypes.current.includes(child.type) || typeof child.type === 'string') {
    const resolvedChildren = mapToResult(child.props.children, contextStack)
    return resolvedChildren;
  }
  if (shouldConstruct(child.type)) {
    if (!!child.type.contextTypes) notSupported(`contextTypes properties on classes like ${child.type.name}`)
    if (!!child.type.childContextTypes) notSupported(`childContextTypes properties on classes like ${child.type.name}`)

    const { inst, isUpdateRequired, doUpdate } = makeClassInstance(child, getContextFromStack(contextStack, child.type.contextType));
    if (inst.shouldComponentUpdate) {
      logOnce('WARNING: use of shouldComponentUpdate is not supported for static traversal, and its effects will be ignored.');
    }
    let traversed = undefined;
    do {
      doUpdate();
      const inner = inst.render();
      traversed = saneTraverse(inner, contextStack)
    } while (isUpdateRequired())
    
    return [traversed];
  } else {
    let res = usingFakeDispatcher(contextStack, (dispatcher) => {
      let traversed = undefined;
      do {
        dispatcher._rewind();
        const inner = child.type(child.props)
        traversed = saneTraverse(inner, contextStack)
      } while(dispatcher._rebuild())

      return [traversed];
    });
    return res;
  }
}

const makeTraverseFunction = (reduce, isRoot) => {
  
  const traverse = (element, contextStack) => {
    const getContext = ctx => getContextFromStack(contextStack, ctx)
    
    if (!element || typeof element !== "object" || (Array.isArray(element) && element.length === 0)) {
      // users can pass in non-renderables such as empty arrays or booleans. Sanitise those away 
      const saneElement = ['number', 'string'].includes(typeof element) ? element : undefined;
      const reduceResult = reduce.reduce({unbox: () => undefined, element: saneElement, getContext, isRoot: false, isLeaf: true});
      return reduceResult && typeof reduceResult.then === "function"
        ? reduceResult.then(res => ReduceResult.cast(res))
        : ReduceResult.cast(reduceResult);
    }

    const unbox = (child, reduceOverride) => {
      const saneChild = child ? <>{child}</> : element;
      if (reduceOverride) {
        const newIsRoot = child ? el => !!child && (Array.isArray(child) ? child : [child]).includes(el) : isRoot
        const saneOverride = ReducerFunction.cast(reduceOverride)
        const newTraverse = makeTraverseFunction(saneOverride, newIsRoot);
        const array = processChild({child: saneChild, traverse: newTraverse, contextStack});

        return array.filter(x => x && typeof x.then === "function").length > 0
          ? Promise.all(array).then(arr => saneOverride.finalTransform(ReduceResult.flatten(arr)))
          : saneOverride.finalTransform(ReduceResult.flatten(array));
      } else {
        const array = processChild({child: saneChild, traverse, contextStack })
        
        return array.filter(x => x && typeof x.then === "function").length > 0
          ? Promise.all(array).then(arr => ReduceResult.flatten(arr))
          : ReduceResult.flatten(array);
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
  const saneReduceChildrenArray = ReducerFunction.cast(reduceChildrenArray || (({array}) => array));
  const traverse = makeTraverseFunction(saneReduceChildrenArray, e => e === child);
  const res = traverse(child, []);
  return res && typeof res.then === "function"
    ? res.then(arr => saneReduceChildrenArray.finalTransform(ReduceResult.flatten(arr)))
    : saneReduceChildrenArray.finalTransform(ReduceResult.flatten(res));
}
import React from 'react';
import ReactDOM from 'react-dom';

const childArrayMap = new WeakMap();
const getArray = (children) => {
  const hasMemo = childArrayMap.has(children);
  if (hasMemo) {
    return childArrayMap.get(children);
  }
  const res = React.Children.toArray(children);
  
  if(['object', 'array', 'function'].includes(typeof children) && children !== null) {
    childArrayMap.set(children, res);
  }
  return res;
}

const childrenMap = new WeakMap();
const getMappedChildren = ({children, elementMapper, memo}) => {
  const hasMemo = childrenMap.has(children);
  const newChildren = hasMemo
    ? childrenMap.get(children)
    : Recursor({
      children: children,
      elementMapper,
      memo: memo
    });
  
  childrenMap.set(children, newChildren);
  return newChildren;
}

// same props as instance - to trigger same re-evals
const makeDerivedClass = (type) => {
  class DerivedClass extends React.Component {
    constructor(propsAndPayload, ...args) {
      const { ___EIGENCODE_MEMO, ___EIGENCODE_ELEMENTMAPPER, ___EIGENCODE_ONCHILDREN, ...props } = propsAndPayload;
      
      super(propsAndPayload, ...args);
      
      this.___EIGENCODE_ELEMENTMAPPER = ___EIGENCODE_ELEMENTMAPPER;
      this.___EIGENCODE_MEMO = ___EIGENCODE_MEMO;
      this.___EIGENCODE_ONCHILDREN = ___EIGENCODE_ONCHILDREN;

      this.instance = new type(props, ...args);
      this.state = this.instance.state;

      const protectedNames = [
        'constructor',
        'setState',
        'forceUpdate',
        'render',
        'UNSAFE_componentWillUpdate',
        'isMounted',
        'replaceState',
      ]

      let ownFunctions = [];
      let target = this.instance;
      while (target.constructor !== React.Component) {
        target = Object.getPrototypeOf(target);
        ownFunctions = ownFunctions.concat(Object.getOwnPropertyNames(target)
          .filter(x => !protectedNames.includes(x) && typeof this.instance[x] === "function"));
      } 
      
      ownFunctions.forEach(key => {
        this[key] = function(...args) {
          return this.instance[key](...args);
        }
      });

      const derived = this;

      this.instance.setState = function(...args) {
        derived.setState(...args);
      }

      this.instance.forceUpdate = function(...args) {
        derived.forceUpdate(...args);
      }

      this.UNSAFE_componentWillUpdate = (nextProps, nextState, nextContext) => {
        const { ___EIGENCODE_MEMO, ___EIGENCODE_ELEMENTMAPPER, ___EIGENCODE_ONCHILDREN, ...saneNextProps } = nextProps;
      
        if (typeof this.instance.UNSAFE_componentWillUpdate === "function") {
          this.instance.UNSAFE_componentWillUpdate(saneNextProps, nextState, nextContext)
        }
        this.instance.props = saneNextProps;
        this.instance.context = nextContext;
        this.instance.state = nextState;
      }
      
      if (this.instance instanceof React.PureComponent) {
        this.shouldComponentUpdate = function(nextProps) {
          const keys = [...new Set([...Object.keys(nextProps), ...Object.keys(this.props)])]
          return keys.reduce((m, x) => m || nextProps[x] !== this.props[x], false)
        }
      }

      this.render = function() {
        const children = getArray(this.instance.render());
        this.___EIGENCODE_ONCHILDREN(children);
        return Recursor({
          children,
          elementMapper: this.___EIGENCODE_ELEMENTMAPPER,
          memo: this.___EIGENCODE_MEMO
        });
      }
    }
  }

  DerivedClass.displayName = type.displayName || type.name;
  return DerivedClass;
}

const saneToArray = (children) => {
  const res = [];
  React.Children.map(children, c => res.push(c));
  return res;
}

const makeDerivedFunction = (type) => {
  let Derived = (propsAndPayload, ...args) => {
    const { ___EIGENCODE_MEMO, ___EIGENCODE_ELEMENTMAPPER, ___EIGENCODE_ONCHILDREN, ...props } = propsAndPayload;
    const res = getArray(type(props, ...args));
    ___EIGENCODE_ONCHILDREN(res);
    return Recursor({
      children: res,
      elementMapper: ___EIGENCODE_ELEMENTMAPPER,
      memo: ___EIGENCODE_MEMO,
      siblingIndex: 0,
      siblingCount: 1
    })
  }

  Derived.displayName = type.displayName || type.name;
  return Derived;
};

const derivedFunctions = new WeakMap();

const getDerivedFunction = (type) => {
  let Derived = derivedFunctions.get(type);
  if (!Derived) {
    Derived = makeDerivedFunction(type);
    derivedFunctions.set(type, Derived);
  }

  return Derived;
}

const derivedClasses = new WeakMap();


const getDerivedClass = (type) => {
  let Derived = derivedClasses.get(type);
  if (!Derived) {
    Derived = makeDerivedClass(type);
    derivedClasses.set(type, Derived);
  }

  return Derived;
}

const shouldConstruct = (Component) => {
  return Component && Component.prototype && Component.prototype.isReactComponent;
}

const REACT___shouldSetTextContent = (type, props) => {
  return type === 'textarea' || type === 'option' || type === 'noscript' || typeof props.children === 'string' || typeof props.children === 'number' || (typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML !== null && props.dangerouslySetInnerHTML.__html != null);
}

const getSymbol = element => {
  const elementString = 
    (element && element.type && element.type.$$typeof && element.type.$$typeof.toString()) || 
    (element && element.$$typeof && element.$$typeof.toString());

  const match = elementString && elementString.match(/Symbol\(react\.([^)]+)\)/);

  return match ? match[1] : null;
}

const doMapElement = (mapElement, element, memo, siblingIndex, siblingCount) => {
  const result = mapElement({
    element: element,
    memo: memo,
    siblingIndex: siblingIndex,
    siblingCount: siblingCount,
    getContext: ctx => typeof ctx === 'object' ? ctx._currentValue : undefined, 
    type: element ? element.type || typeof element : undefined,
    props: (element && element.props) || {}
  })

  let res = result, newMemo = memo, hooks = {};

  if (Array.isArray(result)) {
    res = result[0];
    newMemo = result[1];
    hooks = result[2] || {};
  }

  return [res && typeof res === "object" ? {
    ...res,
    key: res.key || element.key,
    ref: res.ref || element.ref,
  } : res, newMemo, hooks];
}

const makeElementMapper = mapElement => {
  const elementMapper = (childElement, memo, siblingIndex, siblingCount) => {
    if (childElement && childElement.type === Substitute) {
      const mapElementOne = mapElement;
      const memoOne = memo;
            
      const mapElementTwo = childElement.props.mapElement;
      const memoTwo = undefined; // for now!

      const memoCombined = {
        memoOne,
        memoTwo
      };

      const mapElementCombined = ({memo, element, type, props, ...rest}) => {
        const resultTwo = mapElementTwo({memo: memo.memoTwo, element, type, props, ...rest});
        const intermediateElement = Array.isArray(resultTwo) ? resultTwo[0] : resultTwo; 
        const intermediateType = intermediateElement ? intermediateElement.type || typeof intermediateElement : undefined;
        const intermediateProps = (intermediateElement && intermediateElement.props) || {};
        const resultOne = mapElementOne({memo: memo.memoOne, element: intermediateElement, type: intermediateType, props: intermediateProps, ...rest});
        const finalElement = Array.isArray(resultOne) ? resultOne[0] : resultOne;
        const finalMemo = {
          memoOne: Array.isArray(resultOne) ? resultOne[1] : memo.memoOne,
          memoTwo: Array.isArray(resultTwo) ? resultTwo[1] : memo.memoTwo,
        }

        const onCarTwo = Array.isArray(resultTwo) && resultTwo[2] && resultTwo[2].onChildrenArrayResolved;
        const onCarOne = Array.isArray(resultOne) && resultOne[2] && resultOne[2].onChildrenArrayResolved;
        const finalCar = onCarOne || onCarTwo ? car => {
          if (onCarTwo) onCarTwo(car)
          if (onCarOne) onCarOne(car)
        } : undefined;
        const finalHooks = {
          onChildrenArrayResolved: finalCar
        }

        return [finalElement, finalMemo, finalHooks];
      }

      return Recursor({
        elementMapper: makeElementMapper(mapElementCombined),
        memo: memoCombined,
        children: childElement.props.children
      });
    }
    if (typeof childElement === "function") {
      return (...args) => {
        const children = mapped.props.children(...args)
        return Recursor({
          children,
          memo,
          elementMapper
        })
      }
    }
    const [mapped, mappedMemo, hooks] = doMapElement(mapElement, childElement, memo, siblingIndex, siblingCount);
    const onChildren = hooks.onChildrenArrayResolved ? 
      c => hooks.onChildrenArrayResolved(saneToArray(c)) :
      () => {};

    if (!mapped || typeof mapped === "string" || typeof mapped === "number") {
      return mapped;
    }

    if (typeof mapped.type === "string" || mapped.type === React.Suspense || mapped.type === React.Fragment) {
      const childrenAsArray = getArray(mapped.props.children);
      onChildren(childrenAsArray);
      if (childrenAsArray.length === 0) {
        // special case to avoid errors with void tags
        // still invoke mapElement to flush side effects but don't render
        doMapElement(mapElement, null, mappedMemo)
        return mapped;
      }
      if(REACT___shouldSetTextContent(mapped.type, mapped.props)) {
        // react will not actually evaluate children of some nodes (as an optimisation),
        // so Recursor would not drill to the text contents of these.
        // This is why, when we encounter such nodes, we call mapElement on the children directly 
        const [child] = doMapElement(mapElement, childrenAsArray[0], mappedMemo);
        return React.cloneElement(mapped, {children: child});
      }

      const children = Recursor({
        children: childrenAsArray,
        memo: mappedMemo,
        elementMapper
      })
      
      return React.cloneElement(mapped, {children})
    }

    if (getSymbol(mapped) === "memo") {
      const childrenArray = getArray(mapped.props.children);
      onChildren(childrenArray);
      const children = Recursor({
        children: childrenArray,
        elementMapper,
        memo: mappedMemo
      });
      return React.cloneElement(mapped, {children})
    }

    if (getSymbol(mapped) === "provider") {
      const childrenArray = getArray(mapped.props.children);
      onChildren(childrenArray);
      const children = getMappedChildren({children: childrenArray, elementMapper, memo: mappedMemo});
      return React.cloneElement(mapped, {children});
    }

    if (getSymbol(mapped) === "context") {
      const LegacyContextAdapter = () => {
        const context = React.useContext(mapped.type._context);
        const childrenArray = getArray(mapped.props.children(context));
        onChildren(childrenArray);
        return Recursor({
          children: childrenArray,
          elementMapper,
          memo: mappedMemo
        })
      }
      // todo: name
      return <LegacyContextAdapter />
    }

    if (getSymbol(mapped) === "portal") {
      const childrenArray = getArray(mapped.children);
      onChildren(childrenArray);
      const element = ReactDOM.createPortal(
        Recursor({
          children: childrenArray,
          memo: mappedMemo,
          elementMapper
        }),
        mapped.containerInfo, 
        mapped.key);

      return {
        ...element,
        key: mapped.key,
        ref: mapped.ref
      };
    }

    if (getSymbol(mapped) === "lazy") {
      let NewLazy = React.lazy(
        () => mapped.type._ctor()
          .then(module => ({
            default: (...args) => {
              const childrenArray = getArray(module.default(...args));
              onChildren(childrenArray);
              return Recursor({
                children: childrenArray,
                memo:mappedMemo,
                elementMapper
              });
            }
          }))
      );
      const element = <NewLazy {...mapped.props} />
      return {
        ...element,
        key: mapped.key,
        ref: mapped.ref
      };
    }

    if (getSymbol(mapped) === "forward_ref") {
      const MappedForwardRef = React.forwardRef((props, ref) => {
        const childrenArray = getArray(mapped.type.render(props, ref));
        onChildren(childrenArray);
        return Recursor({
          children: childrenArray,
          memo: mappedMemo,
          elementMapper
        })
      });

      const element = <MappedForwardRef {...mapped.props} key={mapped.key} ref={mapped.ref} />
      return element;
      // return {
      //   ...element,
      //   key: mapped.key,
      //   ref: mapped.ref,
      // }
    }

    if (shouldConstruct(mapped.type)) {
      const Derived = getDerivedClass(mapped.type);
      const res = <Derived ___EIGENCODE_MEMO={mappedMemo} ___EIGENCODE_ELEMENTMAPPER={elementMapper} ___EIGENCODE_ONCHILDREN={onChildren} key={mapped.key} ref={mapped.ref} {...mapped.props} />
      return res;

      // return {
      //   ...res,
      //   key: mapped.key,
      //   ref: mapped.ref
      // }
    }

    if (typeof mapped.type === "function") {
      const Derived = getDerivedFunction(mapped.type);
      const res = <Derived ___EIGENCODE_MEMO={mappedMemo} ___EIGENCODE_ELEMENTMAPPER={elementMapper} ___EIGENCODE_ONCHILDREN={onChildren} {...mapped.props} />;
      return {
        ...res,
        key: mapped.key,
        ref: mapped.ref
      };
    }

    throw new Error("This shouldn't happen");
  };
  return elementMapper;
};

const Recursor = ({children, elementMapper, memo, siblingIndex, siblingCount}) => {
  const childrenCount = React.Children.toArray(children).length;
  if (childrenCount === 0) {
    // special case to flush mapElement side effects
    const res = elementMapper(null, memo, siblingIndex, siblingCount);
    return [true, false, undefined].includes(res) ? null : res;
  } else if (childrenCount === 1) {
    let c = saneToArray(children)[0];
    if (!c.key) {
      // this happens when Replaer itself only has a single child element
      // todo: refactor to handle this edge case more nicely.
      c = React.Children.toArray(children)[0];
    }
    const res = elementMapper(c, memo, siblingIndex, siblingCount);
    // if (getSymbol(res) === "provider") {
    //   return <Memoed element={res} original={c} />
    // }
    return [true, false, undefined].includes(res) ? null : res;
  } 
  const newChildren = saneToArray(children).map((c, i) => Recursor({
    elementMapper,
    memo,
    siblingIndex: i,
    siblingCount: childrenCount,
    children: c
  }))
  return newChildren; 
}

const Substitute = ({children, mapElement}) => {
  if (!mapElement) {
    throw new Error('Substitute has no mapElement function specified')
  }
  
  const elementMapper = makeElementMapper(mapElement);
  return Recursor({
    elementMapper,
    children
  });
}

export default Substitute;
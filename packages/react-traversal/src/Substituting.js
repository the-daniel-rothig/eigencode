import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

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
  
  if(!hasMemo && ['object', 'array', 'function'].includes(typeof children) && children !== null) {
    childrenMap.set(children, newChildren);
  }
  return newChildren;
}

// same props as instance - to trigger same re-evals
const makeDerivedClass = (type) => {
  class DerivedClass extends React.Component {
    constructor(propsAndPayload, ...args) {
      const { ___eigencode_memo, ___eigencode_elementmapper, ...props } = propsAndPayload;
      
      const realConsoleError = console.error;
      console.error = (...args) => {
        if (args[0].indexOf("make sure to pass up the same props that your component's constructor was passed.") === -1) {
          realConsoleError(...args);
        }
      }
      try {
        super(props, ...args);
      } finally {
        setTimeout(() => console.error = realConsoleError, 0)
        //console.error = realConsoleError;
      }
      
      this.___eigencode_elementmapper = ___eigencode_elementmapper;
      this.___eigencode_memo = ___eigencode_memo;

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
        const { ___eigencode_memo, ___eigencode_elementmapper, ...saneNextProps } = nextProps;
      
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
        const children = this.instance.render();
        return getMappedChildren({
          children,
          elementMapper: this.___eigencode_elementmapper,
          memo: this.___eigencode_memo
        });
      }
    }
  }

  DerivedClass.displayName = type.displayName || type.name;
  return DerivedClass;
}


const makeDerivedFunction = (type) => {
  let Derived = (propsAndPayload, ...args) => {
    const { ___eigencode_memo, ___eigencode_elementmapper, ...props } = propsAndPayload;
    const res = type(props, ...args);
    return getMappedChildren({
      children: res,
      elementMapper: ___eigencode_elementmapper,
      memo: ___eigencode_memo,
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

  let res = result, newMemo = memo;

  if (Array.isArray(result)) {
    res = result[0];
    newMemo = result[1];
  }

  return [res && typeof res === "object" ? {
    ...res,
    key: res.key || element.key,
    ref: res.ref || element.ref,
  } : res, newMemo];
}

const makeElementMapper = mapElement => {
  const elementMapper = (childElement, memo, siblingIndex, siblingCount) => {
    //console.log('render recursor for', childElement && childElement.type ? childElement.type.name || childElement.type : childElement)
  
    if (childElement && childElement.type === Substituting) {
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
        return [finalElement, finalMemo];
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
        return getMappedChildren({
          children,
          memo,
          elementMapper
        })
      }
    }
    const [mapped, mappedMemo] = doMapElement(mapElement, childElement, memo, siblingIndex, siblingCount)

    if (!mapped || typeof mapped === "string" || typeof mapped === "number") {
      return mapped;
    }

    if (typeof mapped.type === "string" || mapped.type === React.Suspense || mapped.type === React.Fragment) {
      if (React.Children.toArray(mapped.props.children).length === 0) {
        // special case to avoid errors with void tags
        // still invoke mapElement to flush side effects but don't render
        doMapElement(mapElement, null, mappedMemo)
        return mapped;
      }
      if(REACT___shouldSetTextContent(mapped.type, mapped.props)) {
        // react will not actually evaluate children of some nodes (as an optimisation),
        // so Recursor would not drill to the text contents of these.
        // This is why, when we encounter such nodes, we call mapElement on the children directly 
        const [child] = doMapElement(mapElement, mapped.props.children, mappedMemo);
        return React.cloneElement(mapped, {children: child});
      }

      const children = getMappedChildren({
        children: mapped.props.children,
        memo: mappedMemo,
        elementMapper
      })
      
      return React.cloneElement(mapped, {children})
    }

    if (getSymbol(mapped) === "memo") {
      const children = getMappedChildren({
        children: mapped.props.children,
        elementMapper,
        memo: mappedMemo
      });
      return React.cloneElement(mapped, {children})
    }

    if (getSymbol(mapped) === "provider") {
      const children = getMappedChildren({children: mapped.props.children, elementMapper, memo: mappedMemo});
      return React.cloneElement(mapped, {children});
    }

    if (getSymbol(mapped) === "context") {
      const LegacyContextAdapter = () => {
        const context = React.useContext(mapped.type._context);
        const children = mapped.props.children(context);
        return getMappedChildren({
          children,
          elementMapper,
          memo: mappedMemo
        })
      }
      // todo: name
      return <LegacyContextAdapter />
    }

    if (getSymbol(mapped) === "portal") {
      const element = ReactDOM.createPortal(
        getMappedChildren({
          children: mapped.children,
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
              const children = module.default(...args);
              return getMappedChildren({
                children,
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
        const children = mapped.type.render(props, ref);
        return getMappedChildren({
          children,
          memo: mappedMemo,
          elementMapper
        })
      });

      const element = <MappedForwardRef {...mapped.props} />
      return {
        ...element,
        key: mapped.key,
        ref: mapped.ref,
      }
    }

    if (shouldConstruct(mapped.type)) {
      const Derived = getDerivedClass(mapped.type);
      //console.log('derived class', Derived.displayName);
      const res = <Derived ___eigencode_memo={mappedMemo} ___eigencode_elementmapper={elementMapper} {...mapped.props} />
      return res;
      // return {
      //   ...res,
      //   key: mapped.key,
      //   ref: mapped.ref
      // }
    }

    if (typeof mapped.type === "function") {
      const Derived = getDerivedFunction(mapped.type);
      const res = <Derived ___eigencode_memo={mappedMemo} ___eigencode_elementmapper={elementMapper} {...mapped.props} />;
      return res;
      // return {
      //   ...res,
      //   key: mapped.key,
      //   ref: mapped.ref
      // };
      //return mappedElement;
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
    const c = React.Children.toArray(children)[0];
    const res = elementMapper(c, memo, siblingIndex, siblingCount);
    // if (getSymbol(res) === "provider") {
    //   return <Memoed element={res} original={c} />
    // }
    return [true, false, undefined].includes(res) ? null : res;
  } 
  const newChildren = React.Children.toArray(children).map((c, i) => Recursor({
    elementMapper,
    memo,
    siblingIndex: i,
    siblingCount: childrenCount,
    children: c
  }))
  return newChildren; 
}

const Substituting = ({children, mapElement}) => {
  if (!mapElement) {
    throw new Error('Substituting has no mapElement function specified')
  }
  const elementMapper = makeElementMapper(mapElement);
  return Recursor({
    elementMapper,
    children
  });
} 

Substituting.propTypes = {
  children: PropTypes.node,
  mapElement: PropTypes.func.isRequired,
}

export default Substituting;
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

const PropagationStopper = React.memo(({children}) => children, (p,n) => p.children === n.children);

// same props as instance - to trigger same re-evals

const makeDerivedClass = (type) => {
  class DerivedClass extends React.Component {
    constructor(propsAndPayload, ...args) {
      super(propsAndPayload, ...args);

      const { ___eigencode_memo, ___eigencode_elementMapper, ...props } = propsAndPayload;

      this.___eigencode_elementMapper = ___eigencode_elementMapper;
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
        if (typeof this.instance.UNSAFE_componentWillUpdate === "function") {
          this.instance.UNSAFE_componentWillUpdate(nextProps, nextState, nextContext)
        }
        this.instance.props = nextProps;
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
        return Recursor({
          children,
          elementMapper: this.___eigencode_elementMapper,
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
    const { ___eigencode_memo, ___eigencode_elementMapper, ...props } = propsAndPayload;
    const res = type(props, ...args);
    return Recursor({
      children: res,
      elementMapper: ___eigencode_elementMapper,
      memo: ___eigencode_memo,
      siblingIndex: 0,
      siblingCount: 1
    })
  }

  Derived.displayName = type.displayName || type.name || "foo";
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
  return type === 'textarea' || type === 'option' || type === 'noscript' || typeof props.children === 'string' || typeof props.children === 'number' || typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML !== null && props.dangerouslySetInnerHTML.__html != null;
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
    props: element && element.props || {}
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

      const mapElementCombined = ({memo, element, ...rest}) => {
        const resultTwo = mapElementTwo({memo: memo.memoTwo, element, ...rest});
        const intermediateElement = Array.isArray(resultTwo) ? resultTwo[0] : resultTwo; 
        const resultOne = mapElementOne({memo: memo.memoOne, element: intermediateElement, ...rest});
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
        return Recursor({
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
      if (React.Children.count(mapped.props.children) === 0) {
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

      const children = Recursor({
        children: mapped.props.children,
        memo: mappedMemo,
        elementMapper
      })
      
      return React.cloneElement(mapped, {children})
    }

    if (getSymbol(mapped) === "memo") {
      const children = Recursor({
        children: mapped.props.children,
        elementMapper,
        memo: mappedMemo
      });
      return React.cloneElement(mapped, {children})
    }

    if (getSymbol(mapped) === "provider") {
      const children = Recursor({
        children: mapped.props.children,
        elementMapper,
        memo: mappedMemo
      });
      return React.cloneElement(mapped, {children});
    }

    if (getSymbol(mapped) === "context") {
      const LegacyContextAdapter = () => {
        const context = React.useContext(mapped.type._context);
        const children = mapped.props.children(context);
        return Recursor({
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
        Recursor({
          children: mapped.children,
          memo: mappedMemo,
          mapElement
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
              return Recursor({
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
        return Recursor({
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
      const res = <Derived ___eigencode_memo={mappedMemo} ___eigencode_elementMapper={elementMapper} {...mapped.props} />
      return res;
      // return {
      //   ...res,
      //   key: mapped.key,
      //   ref: mapped.ref
      // }
    }

    if (typeof mapped.type === "function") {
      const Derived = getDerivedFunction(mapped.type);
      //console.log('derived', Derived.displayName);
      const res = <Derived ___eigencode_memo={mappedMemo} ___eigencode_elementMapper={elementMapper} {...mapped.props} />;
      return res;
      // return {
      //   ...res,
      //   key: mapped.key,
      //   ref: mapped.ref
      // };
      //return mappedElement;
    }

    throw "This shouldn't happen";
  };
  return elementMapper;
};

const Recursor = ({children, elementMapper, memo, siblingIndex, siblingCount}) => {
  const childrenCount = React.Children.count(children);
  if (childrenCount === 0) {
    // special case to flush mapElement side effects
    return elementMapper(null, memo, 0, 1);
  } else if (childrenCount === 1) {
    const c = React.Children.toArray(children)[0];
    return elementMapper(c, memo, siblingIndex, siblingCount);
  } 
  const newChildren = React.Children.map(children, (c, i) => Recursor({
    elementMapper,
    memo,
    siblingIndex: i,
    siblingCount: childrenCount,
    children: c
  }))
  return newChildren; 
}//, (p,n) => n.children && n.children.type === PropagationStopper);

const Substituting = ({children, mapElement}) => {
  if (!mapElement) {
    throw 'Substituting has no mapElement function specified'
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
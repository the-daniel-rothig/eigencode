import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

const PropagationStopper = React.memo(({children}) => children, (p,n) => p.children === n.children);

// same props as instance - to trigger same re-evals
class DerivedClass extends React.Component {
  constructor(propsAndInstance, ...args) {
    super(propsAndInstance, ...args);

    const { ___$EIGENCODE_PAYLOAD, ...props } = propsAndInstance;

    this.instance = new ___$EIGENCODE_PAYLOAD.innerType(props, ...args);
    this.state = this.instance.state;

    const protectedNames = [
      'constructor',
      'setState',
      'forceUpdate',
      'render',
      'UNSAFE_componentWillUpdate'
    ]

    let ownFunctions = [];
    let target = this.instance;
    while (target.constructor !== React.Component) {
      target = Object.getPrototypeOf(target);
      ownFunctions = ownFunctions.concat(Object.getOwnPropertyNames(target)
        .filter(x => typeof this.instance[x] === "function" && !protectedNames.includes(x)));
    } 
    
    ownFunctions.forEach(key => {
      this[key] = function(...args) {
        this.instance[key](...args);
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
      const res = this.instance.render();
      return <Recursor memo={this.props.___$EIGENCODE_PAYLOAD.memo} elementMapper={this.props.___$EIGENCODE_PAYLOAD.elementMapper}>{res}</Recursor>
    }
  }
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
    console.log('render recursor for', childElement && childElement.type ? childElement.type.name || childElement.type : childElement)
  
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

      return <Recursor elementMapper={makeElementMapper(mapElementCombined)} memo={memoCombined}>{childElement.props.children}</Recursor>;
    }
    if (typeof childElement === "function") {
      return (...args) => {
        const res = mapped.props.children(...args)
        return <Recursor elementMapper={elementMapper} memo={memo}>{res}</Recursor>
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
      
      return React.cloneElement(mapped, {children: (
        <Recursor elementMapper={elementMapper} memo={mappedMemo}>{mapped.props.children}</Recursor>
      )})
    }

    if (getSymbol(mapped) === "memo") {
      return React.cloneElement(mapped, {children: (
        <Recursor elementMapper={elementMapper} memo={mappedMemo}>{mapped.props.children}</Recursor>
      )})
    }

    if (getSymbol(mapped) === "provider") {
      return React.cloneElement(mapped, {children: (
        <Recursor elementMapper={elementMapper} memo={mappedMemo}><PropagationStopper><>{mapped.props.children}</></PropagationStopper></Recursor>
      )})
    }

    if (getSymbol(mapped) === "context") {
      const LegacyContextAdapter = () => {
        const context = React.useContext(mapped.type._context);
        return <Recursor elementMapper={elementMapper} memo={mappedMemo}>{mapped.props.children(context)}</Recursor>
      }
      return <LegacyContextAdapter />
    }

    if (getSymbol(mapped) === "portal") {
      const element = ReactDOM.createPortal(
        <Recursor elementMapper={elementMapper} memo={mappedMemo}>
          {mapped.children}
        </Recursor>, 
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
            return <Recursor elementMapper={elementMapper} memo={mappedMemo}>{module.default(...args)}</Recursor>
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
        const inner = mapped.type.render(props, ref);
        return <Recursor elementMapper={elementMapper} memo={mappedMemo}>{inner}</Recursor>
      })

      const element = <MappedForwardRef {...mapped.props} />
      return {
        ...element,
        key: mapped.key,
        ref: mapped.ref,
      }
    }

    if (typeof mapped.type === "function") {
      const inner = mapped.type(mapped.props);
      const mappedElement = (
        <Recursor elementMapper={elementMapper} memo={mappedMemo}>
          {inner}
        </Recursor>
      );
      return mappedElement;
    }

    throw "This shouldn't happen";
  };
  return elementMapper;
};

const Recursor = React.memo(({children, elementMapper, memo, siblingIndex, siblingCount}) => {
  const childrenCount = React.Children.count(children);
  if (childrenCount === 0) {
    // special case to flush mapElement side effects
    return elementMapper(null, memo, 0, 1);
  } else if (childrenCount === 1) {
    const c = React.Children.toArray(children)[0];
    const payload = {
      innerType: c && c.type,
      elementMapper,
      memo,
      siblingIndex,
      siblingCount
    };
    return c && shouldConstruct(c && c.type)
      ? <DerivedClass ___$EIGENCODE_PAYLOAD={payload} {...c.props} />
      : elementMapper(c, memo, siblingIndex, siblingCount);
  } 
  const newChildren = React.Children.map(children, (c, i) => <Recursor elementMapper={elementMapper} memo={memo} siblingIndex={i} siblingCount={childrenCount}>{c}</Recursor>);
  return newChildren; 
}, (p,n) => n.children && n.children.type === PropagationStopper);

const Substituting = ({children, mapElement}) => {
  if (!mapElement) {
    throw 'Substituting has no mapElement function specified'
  }
  const elementMapper = makeElementMapper(mapElement);
  return <Recursor elementMapper={elementMapper}>{children}</Recursor>
} 

Substituting.propTypes = {
  children: PropTypes.node,
  mapElement: PropTypes.func.isRequired,
}

export default Substituting;
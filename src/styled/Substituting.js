import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

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
    if (childElement && childElement.type === Substituting) {
      const combined = (args) => {
        let one = childElement.props.mapElement(args), newMemo = memo;
        if (Array.isArray(one)) {
          one = one[0]
          newMemo = one[1]
        }
        return doMapElement(mapElement, one, newMemo, siblingIndex, siblingCount);
      }
      return <Recursor elementMapper={makeElementMapper(combined)} memo={memo}>{childElement.props.children}</Recursor>;
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

    if (typeof mapped.type === "string" || getSymbol(mapped) === "provider" || mapped.type === React.Suspense || mapped.type === React.Fragment) {
      if (React.Children.count(mapped.props.children) === 0) {
        // special case to avoid errors with void tags
        // still invoke mapElement to flush side effects but don't render
        doMapElement(mapElement, null, mappedMemo)
        return mapped;
      }
      if(REACT___shouldSetTextContent(mapped.type, mapped.props)) {
        // react will not actually evaluate children of some nodes (as an optimisation),
        // so call mapElement directly here. 
        const [child] = doMapElement(mapElement, mapped.props.children, mappedMemo);
        return React.cloneElement(mapped, {children: child});
      }
      
      return React.cloneElement(mapped, {children: (
        <Recursor elementMapper={elementMapper} memo={mappedMemo}>{mapped.props.children}</Recursor>
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
    
    if (shouldConstruct(mapped.type)) {
      class Derived extends mapped.type {
        constructor(...args) {
          super(...args)
        }

        render() {
          const res = super.render();
          return <Recursor elementMapper={elementMapper} memo={mappedMemo}>{res}</Recursor>
        }
      }
      return <Derived {...mapped.props} />;
    }

    if (typeof mapped.type === "function") {
      const mappedElement = (
        <Recursor elementMapper={elementMapper} memo={mappedMemo}>
          {mapped.type(mapped.props)}
        </Recursor>
      );
      return mappedElement;
    }

    throw "This shouldn't happen"
  };
  return elementMapper;
};

const Recursor = ({children, elementMapper, memo}) => {
  const siblingCount = React.Children.count(children);
  if (siblingCount === 0) {
    // special case to flush mapElement side effects
    return elementMapper(null, memo);
  } 
  const newChildren = React.Children.map(children, (c, i) => elementMapper(c, memo, i, siblingCount));
  return newChildren; 
} 

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
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

const shouldConstruct = (Component) => {
  return Component && Component.prototype && Component.prototype.isReactComponent;
}

const getSymbol = element => {
  const elementString = 
    (element && element.type && element.type.$$typeof && element.type.$$typeof.toString()) || 
    (element && element.$$typeof && element.$$typeof.toString());

  const match = elementString && elementString.match(/Symbol\(react\.([^)]+)\)/);

  return match ? match[1] : null;
}

const isElement = el => el.$$typeof && el.$$typeof.toString() === "Symbol(react.element)";

const doMapElement = (mapElement, element, memo, siblingIndex) => {
  const result = mapElement({
    element: element,
    memo: memo,
    siblingIndex: siblingIndex,
    type: element ? element.type || typeof element : undefined,
    props: element && element.props || {}
  })

  let res = result, newMemo = memo;

  if (Array.isArray(result)) {
    res = result[0];
    newMemo = result[1];
  }

  return [typeof res === "object" ? {
    ...res,
    key: res.key || element.key,
    ref: res.ref || element.ref,
  } : res, newMemo];
}

const mapProp = (prop, mapElement, memo) => {
  if (isElement(prop)) {
    //todo: write a test for this
    return {prop: doMapElement(mapElement, prop), shouldClone: true};
  }
  if (React.Children.toArray(prop).filter(isElement).length > 0) {
    return {
      prop: React.Children.map(c => <Substituting mapElement={mapElement} memo={memo}>{c}</Substituting>),
      shouldClone: true
    }
  }
  if (typeof prop !== "function") {
    return {prop}
  }


  const mappedFunc = (...args) => {
    const res = prop(...args);
    const resAsArray = React.Children.toArray(res);
    if (isElement(res) || resAsArray.filter(isElement).length > 0) {
      return <Substituting mapElement={mapElement} memo={memo}>{res}</Substituting>
    } else {
      return res;
    }
  }

  return {prop: mappedFunc, shouldClone: true}
}

const mapProps = (props, mapElement, memo) => {
  let shouldCloneAny = false;
  const mappedProps = {};
  Object.keys(props).forEach(key => {
    const {prop, shouldClone} = mapProp(props[key], mapElement, memo);
    shouldCloneAny = shouldCloneAny || shouldClone;
    mappedProps[key] = prop;
  });

  return {props: mappedProps, shouldClone: shouldCloneAny}
}

const mapChildren = (children, mapElement, memo) => {
  return React.Children.map(children, (c, i) => (
    <Substituting mapElement={mapElement} memo={memo} siblingIndex={i}>{c}</Substituting>
  ))
}

const makeChildMapper = mapElement => (childElement, memo, siblingIndex) => {
    if (childElement && childElement.type === Substituting) {
      const combined = (args) => {
        let one = childElement.props.mapElement(args), newMemo = memo;
        if (Array.isArray(one)) {
          one = one[0]
          newMemo = one[1]
        }
        return doMapElement(mapElement, one, newMemo, siblingIndex);
      }
      return mapChildren(childElement.props.children, combined, memo);
      //return <Substituting mapElement={combined} memo={memo}>{childElement.props.children}</Substituting>;
    }
    if (typeof childElement === "function") {
      return (...args) => {
        const res = mapped.props.children(...args)
        return mapChildren(res, mapElement, memo);
        //return <Substituting mapElement={mapElement} memo={memo}>{res}</Substituting>
      }
    }
    const [mapped, mappedMemo] = doMapElement(mapElement, childElement, memo, siblingIndex)

    if (!mapped || typeof mapped === "string" || typeof mapped === "number") {
      return mapped;
    }

    if (typeof mapped.type === "string" || getSymbol(mapped) === "provider" || mapped.type === React.Suspense || mapped.type === React.Fragment) {
      return React.cloneElement(mapped, {children: mapChildren(mapped.props.children, mapElement, mappedMemo)})
    }

    if (getSymbol(mapped) === "portal") {
      const element = ReactDOM.createPortal(
        <Substituting mapElement={mapElement} memo={mappedMemo}>
          {mapped.children}
        </Substituting>, 
        mapped.containerInfo, 
        mapped.key);
      return {
        ...element,
        key: mapped.key,
        ref: mapped.ref
      };
      //return React.cloneElement(mapped, {children: <Substituting mapElement={mapElement}>{mapped.children}</Substituting>});
    }

    if (getSymbol(mapped) === "lazy") {
      let NewLazy = React.lazy(
        () => mapped.type._ctor()
          .then(module => ({
            default: (...args) => {
            return <Substituting mapElement={mapElement} memo={mappedMemo}>{module.default(...args)}</Substituting>
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
          return <Substituting mapElement={mapElement} memo={mappedMemo}>{res}</Substituting>
        }
      }
      const mappedElement = React.createElement(Derived, mapped.props); 
      return mappedElement;
    }

    if (typeof mapped.type === "function") {
      const mappedElement = (
        <Substituting mapElement={mapElement} memo={mappedMemo}>
          {mapped.type(mapped.props)}
        </Substituting>
      );
      return mappedElement;
    }

    const { props, shouldClone } = mapProps(mapped.props, mapElement, mappedMemo);

    return shouldClone
      ? React.cloneElement(mapped, props)
      : mapped;
  };

const Substituting = ({children, mapElement, memo, siblingIndex}) => {
  if (!mapElement) {
    throw 'Substituting has no mapElement function specified'
  }
  const childMapper = makeChildMapper(mapElement);
  if (React.Children.count(children) === 0) {
    return childMapper(null, memo, siblingIndex);
  }
  const newChildren = React.Children.map(children, c => childMapper(c, memo, siblingIndex));
  return newChildren; 
} 

Substituting.propTypes = {
  children: PropTypes.node,
  mapElement: PropTypes.func.isRequired,
}

export default Substituting;
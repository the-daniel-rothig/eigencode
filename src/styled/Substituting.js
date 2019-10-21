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

const doMapElement = (mapElement, element) => {
  const res = mapElement({
    element: element,
    type: element.type || typeof element,
    props: element.props || {}
  })

  // res.key = res.key || element.key;
  // res.ref = res.ref || element.ref;
  return typeof res === "object" ? {
    ...res,
    key: res.key || element.key,
    ref: res.ref || element.ref,
  } : res;

}

const mapProp = (prop, mapElement) => {
  if (isElement(prop)) {
    //todo: write a test for this
    return {prop: doMapElement(mapElement, prop), shouldClone: true};
  }
  if (React.Children.toArray(prop).filter(isElement).length > 0) {
    return {
      prop: React.Children.map(c => <Substituting mapElement={mapElement}>{c}</Substituting>),
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
      return <Substituting mapElement={mapElement}>{res}</Substituting>
    } else {
      return res;
    }
  }

  return {prop: mappedFunc, shouldClone: true}
}

const mapProps = (props, mapElement) => {
  let shouldCloneAny = false;
  const mappedProps = {};
  Object.keys(props).forEach(key => {
    const {prop, shouldClone} = mapProp(props[key], mapElement);
    shouldCloneAny = shouldCloneAny || shouldClone;
    mappedProps[key] = prop;
  });

  return {props: mappedProps, shouldClone: shouldCloneAny}
}

const makeChildMapper = mapElement => childElement => {
    if (!childElement) {
      return null;
    }
    if (childElement.type === Substituting) {
      const combined = (args) => {
        const one = childElement.props.mapElement(args);
        return doMapElement(mapElement, one);
      }

      return <Substituting mapElement={combined}>{childElement.props.children}</Substituting>;
    }
    if (typeof childElement === "function") {
      return (...args) => {
        const res = mapped.props.children(...args)
        return <Substituting mapElement={mapElement}>{res}</Substituting>
      }
    }
    const mapped = doMapElement(mapElement, childElement)

    if (!mapped || typeof mapped === "string" || typeof mapped === "number") {
      return mapped;
    }

    if (typeof mapped.type === "string" || getSymbol(mapped) === "provider" || mapped.type === React.Suspense) {
      const substitutingChildren = <Substituting mapElement={mapElement}>{mapped.props.children}</Substituting>
      return React.cloneElement(mapped, {children: substitutingChildren})
    }

    if (getSymbol(mapped) === "portal") {
      const element = ReactDOM.createPortal(
        <Substituting mapElement={mapElement}>
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
            return <Substituting mapElement={mapElement}>{module.default(...args)}</Substituting>
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
          return <Substituting mapElement={mapElement}>{res}</Substituting>
        }
      }
      const mappedElement = React.createElement(Derived, mapped.props); 
      return mappedElement;
    }

    if (typeof mapped.type === "function") {
      const mappedElement = (
        <Substituting mapElement={mapElement}>
          {mapped.type(mapped.props)}
        </Substituting>
      );
      return mappedElement;
    }

    const { props, shouldClone } = mapProps(mapped.props, mapElement);

    return shouldClone
      ? React.cloneElement(mapped, props)
      : mapped;
  };

const Substituting = ({children, mapElement}) => {
  if (!mapElement) {
    throw 'Substituting has no mapElement function specified'
  }
  if (React.Children.count(children) === 0) {
    return null;
  }
  const childMapper = makeChildMapper(mapElement);
  const newChildren = React.Children.map(children, childMapper);
  return newChildren; 
} 

Substituting.propTypes = {
  children: PropTypes.node,
  mapElement: PropTypes.func.isRequired,
}

export default Substituting;
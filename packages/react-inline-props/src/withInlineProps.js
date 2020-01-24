import React from 'react';
import $isPlaceholder from './isPlaceholder';
import { InlinePropCombiner, combine } from './combiner';

const extend = (element) => {
  const extended = {
    ...element,
    [$isPlaceholder]: true,
    map: cb => {
      const oldCb = extended.props.map;

      const newCb = oldCb 
        ? x => cb(oldCb(x))
        : cb

      return extend(React.cloneElement(extended, { map: newCb }));
    },
    from: marker => {
      return extend(React.cloneElement(extended, { marker }));
    },
    combine: (props, mappingFn) => {
      const propArray = Array.isArray(props) ? props : [ props ];
      return combine([extended, ...propArray], mappingFn);
    }
  }
  return extended;
}

const makePlaceholder = displayName => {
  const Empty = () => null;
  Empty.displayName = displayName;
  return extend(<Empty />);
}

var hasSymbol = typeof Symbol === 'function' && Symbol.for;

const reactIdentifiers = hasSymbol ? [
  Symbol.for('react.element'),
  Symbol.for('react.portal')
] : [
  0xeac7,
  0xeaca
];

const isChildren = (children) => 
  React.Children
  .toArray(children)
  .filter(c => c && reactIdentifiers.includes(c.$$typeof))
  .length > 0;

const substitute = (c, Hoc, id, idNeeded, placeholderToValue) => {
  
  if ((c && placeholderToValue.has(c.type))) {
    if (c.props.marker !== undefined && c.props.marker !== id) {
      return c;
    }
    const map = c.props.map;
    const val = placeholderToValue.get(c.type);
    if (idNeeded && id !== c.props.marker) {
      return c;
    }
    
    return map ? map(val) : val;
  }

  if (!c || !c.type || !c.props || c[$isPlaceholder]) return c;

  if (c.type === InlinePropCombiner) {
    const parts = c.props.parts.map(
      subChild => substitute(subChild, Hoc, id, idNeeded, placeholderToValue)
    );

    if (parts.filter(x => x[$isPlaceholder]).length === 0) {
      return c.props.mappingFn(...parts);
    }
    return React.cloneElement(c, { parts });
  }

  if (c.type === Hoc) {
    idNeeded = true;
    if (!id) {
      return c;
    }
  }

  const newProps = {};

  Object.keys(c.props).forEach(chKey => {
    if (isChildren(c.props[chKey])) {
      newProps[chKey] = React.Children.map(
        c.props[chKey],
        subChild => substitute(subChild, Hoc, id, idNeeded, placeholderToValue)
      )
    }
  });

  return React.cloneElement(c, newProps);
} 

export default (...args) => Component => {
  const shorthand = args.length !== 1 || typeof args[0] !== "object";
  const opts = shorthand ? { children: args } : args[0];

  const propNames = Object.keys(opts);
  
  const allPlaceholders = {};

  propNames.forEach(key => {
    allPlaceholders[key] = {};
    const arr = typeof opts[key] === "string" ? [ opts[key] ] : opts[key];
    allPlaceholders[key] = arr.map(() => makePlaceholder());
  });

  const Hoc = React.forwardRef(({propId, ...originalProps}, ref) => {
    const props = {...originalProps};

    propNames.forEach(name => {
      const children = props[name];
      const placeholders = allPlaceholders[name];
      props[name] = (...args) => {
        const placeholderToValue = new Map();
        placeholders.forEach((ph, i) => {
          placeholderToValue.set(ph.type, args[i]);
        })
        return React.Children.map(
          children, c => 
          substitute(c, Hoc, propId, false, placeholderToValue)
        )
      }
    })

    return <Component {...props} ref={ref} />
  });

  Hoc.displayName = Component.displayName || Component.name;

  const returnProps = {};

  propNames.forEach(propName => {
    returnProps[propName] = {};
    const arr = typeof opts[propName] === 'string' ? [ opts[propName] ] : opts[propName];
    arr.forEach((inlinePropName, i) => {
      returnProps[propName][inlinePropName] = allPlaceholders[propName][i]
    })
  })

  const secondReturnValue = shorthand ? returnProps.children : returnProps;

  return [Hoc, secondReturnValue];
}
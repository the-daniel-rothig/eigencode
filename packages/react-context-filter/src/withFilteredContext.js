import React, { useContext } from 'react';
import ContextFilter from "./ContextFilter";

const shallowUnchanged = (prev, next) => {
  if (prev === next) return true;
  if (!prev || !next) return false;

  const pKey = Object.keys(prev);
  const nKey = Object.keys(next);
  if (pKey.length !== nKey.length) return false;

  for(var i = 0; i < pKey.length; i++) {
    const key = pKey[i];
    if (prev[key] !== next[key] || !nKey.includes(key)) return false;
  }

  return true;
}

const Inner = ({of: $of, to, propsForComponent, Component}) => {
  let context = useContext(to || $of);

  if (typeof context !== 'object' || context === null) {
    context = { context: context };
  }

  return <Component {...context} {...propsForComponent} />;
}

const withFilteredContext = (props) => Component => {
  const OneOffContext = React.createContext();

  const HigherOrderComponent = (propsForComponent) => {
    const theProps = typeof props === "function"
      ? props(propsForComponent)
      : props;

    const {to, map, isUnchanged, ...rest} = theProps;

    const mappedProps = {
      to: to || OneOffContext,
      map: (...args) => {
        const res = map(...args);
        if (typeof res !== "object") {
          throw Error(`map function of withFilteredContext must return an object, returned ${typeof res}`);
        }
        return res || {};
      },
      isUnchanged: isUnchanged || shallowUnchanged,
      ...rest
    }

    return (
      <ContextFilter {...mappedProps}>
        <Inner {...mappedProps} Component={Component} propsForComponent={propsForComponent}/>
      </ContextFilter>
    );
  };

  HigherOrderComponent.displayName = Component.displayName || Component.name;
  return HigherOrderComponent;
}

export default withFilteredContext;
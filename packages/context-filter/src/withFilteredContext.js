import React, { useContext } from 'react';
import ContextFilter from "./ContextFilter";

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

    const {to, ...rest} = theProps;

    return (
      <ContextFilter to={to || OneOffContext} {...rest}>
        <Inner to={to || OneOffContext} {...rest} Component={Component} propsForComponent={propsForComponent}/>
      </ContextFilter>
    );
  };

  HigherOrderComponent.displayName = Component.displayName || Component.name;
  return HigherOrderComponent;
}

export default withFilteredContext;
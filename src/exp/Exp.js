import React, {useContext, useEffect, useState, useReducer} from 'react';

const Context = React.createContext(null, (prev, next) => prev[0].length !== next[0].length ? 2 : 1)

const useRegistry = () => {
  const [state, dispatch] = useReducer((s, a) => a(s), [])

  const effect = item => () => {
    dispatch(s => [...s, item])
    return () => dispatch(s => s.filter(x => x !== item ))
  }

  return [
    state,
    effect
  ]
}

const Child = ({name}) => {
  const realConsoleError = console.error;
  console.error = () => {}
  const [state, effect] = useContext(Context, 2);
  console.error = realConsoleError;

  useEffect(effect(name), [name])

  return (<span>{name} ({state.length})</span>)
}

const Add = ({name}) => {
  const [state, effect] = useContext(Context)

  return(<button onClick={() => {effect(name)()}}>Add {name}</button>)
}

const Parent = ({children}) => {
  const state = useRegistry()
  console.log('state', state)
  return (
    <Context.Provider value={state}>
      {children}
    </Context.Provider>
  )
};

const Wrapper = ({children}) => {
  const [state] = useContext(Context);
  return (
    <div>
      Total count: {state.length}
      {children}
      
      <Child name="foo" />
      <Child name="bar" />
      <Child name="baz" />
    </div>
  )
}

export const Exp = () => (
  <Parent>
    <Child name="foo" />
    <Child name="bar" />
    <Child name="baz" />
    <Wrapper>
      <Child name="foo" />
      <Child name="bar" />
      <Child name="baz" />
      <Add name='bat' />
    </Wrapper>
  </Parent>
)
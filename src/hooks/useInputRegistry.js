import { useReducer } from 'react';

export default () => {
  const [state, dispatch] = useReducer((s, a) => a(s), [])

  // const effect = item => () => {
  //   dispatch(s => [...s, item])
  //   return () => dispatch(s => s.filter(x => x !== item ))
  // }

  const register = item => dispatch(s => [...s, item]);
  const deregister = item => dispatch(s => s.filter(x => x!==item));

  return [
    state,
    register,
    deregister
  ]
}
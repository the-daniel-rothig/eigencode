import { useEffect, useRef } from 'react';

export default val => {
  const ref = useRef(val)

  useEffect(() => () => {
    ref.current = val
  })

  return ref.current;
}
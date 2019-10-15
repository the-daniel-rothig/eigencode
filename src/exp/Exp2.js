import React, { useLayoutEffect, useEffect, useState, useRef } from 'react'

const Container = ({children}) => {
  const ref = useRef();

  useLayoutEffect(
    () => {
      alert('begin')
      return () => alert('end')
    }
  )

  useEffect(() => {
    // const observer = new MutationObserver((e) => alert(JSON.stringify(e, null, '  ')));
    // observer.observe(ref.current, {
    //   childlist: true,
    //   subtree: true,
    //   attributes: true,
    //   characterData: true,
    // })
    // return () => observer.disconnect()
  })

  const children2 = React.Children.map(children, child => ({...child, componentDidMount: () => alert('boom')}));

  return <div ref={ref}>{children2}</div>
}

const Inner = () => {
  const [state, setState] = useState(false);

  return (
    <>
      <p>{state ? "long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long" : "short"}</p>
      <button onClick={() => setState(!state)}>click me</button>
    </>
  )
}

export const Exp2 = () => {

  return (
    <Container>
      <Inner />
    </Container>
  )
}
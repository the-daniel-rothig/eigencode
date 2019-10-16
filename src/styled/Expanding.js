import React, { useRef, useLayoutEffect} from 'react';
import AnimateHeight from 'react-animate-height';
import useExpiringState from '../hooks/useExpiringState';

const Expanding = ({render, bounce = true}) => {
  const divRef = useRef();
  const [state, setState, isStale] = useExpiringState({collapsed: !!bounce});

  useLayoutEffect(() => {
    if (!divRef.current || divRef.current.innerHTML.length === 0) {
      setState({collapsed: true})
    } else {
      setState({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  
  const hide = next => {
    setState({collapsed: true, cb: next});
  }

  const show = next => {
    setState({})
    if (next) {
      next();
    }
  }

  return (
    <AnimateHeight 
      duration={200}
      height={state.collapsed ? 0 : 'auto'}
      onAnimationEnd={() => {
        if (!isStale() && state.cb) {
          state.cb();
        }
      }}
    >
      <div ref={divRef}>
        {render({show, hide})}
      </div>
    </AnimateHeight> 
  );
}

export default Expanding;

import React, { useRef, useLayoutEffect} from 'react';
import AnimateHeight from 'react-animate-height';
import useExpiringState from '../hooks/useExpiringState';

const Expanding = ({render}) => {
  const divRef = useRef();
  const [state, setState, isStale] = useExpiringState({renderDiv: true});

  useLayoutEffect(() => {
    if (!divRef.current || divRef.current.clientHeight === 0) {
      setState({collapsed: true})
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

  const WrapperTag = state.renderDiv ? ({chidren}) => <div ref={divRef}>{chidren}</div> : React.Fragment;
  
  return (
    <WrapperTag>
      <AnimateHeight 
        duration={200}
        height={state.collapsed ? 0 : 'auto'}
        onAnimationEnd={() => {
          if (!isStale() && state.cb) {
            state.cb();
          }
        }}
      >
        {render({show, hide})}
      </AnimateHeight> 
    </WrapperTag>
  );
}

export default Expanding;

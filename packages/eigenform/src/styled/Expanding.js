import React, { useRef, useLayoutEffect, useState} from 'react';
import AnimateHeight from 'react-animate-height';
import { useExpiringState } from 'eigencode-shared-utils';

const Expanding = ({render, className, children, bounce = true}) => {
  const divRef = useRef();
  const [state, setState, isStale] = useExpiringState({collapsed: !!bounce});
  const [animating, setAnimating] = useState(false);

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
    if (animating) {
      setState({cb: next, collapsed: false, multipleAnimations: true})
    } else {
      setState({collapsed: false})
      if (next) {
        next();
      }
    }
  }

  return (
    <AnimateHeight 
      className='expanding'
      duration={state.multipleAnimations ? 5 : 200}
      height={state.collapsed ? 0 : 'auto'}
      onAnimationStart={() => {
        setAnimating(true)
      }}
      onAnimationEnd={() => {
        if (!isStale() && state.cb) {
          // the timeout ensures the callback is invoked
          // after AnimateHeight has unmounted the contents
          setTimeout(state.cb, 0);
        }
        setAnimating(false)
      }}
    >
      <div className='expanding-layout-reset'/>
      <div ref={divRef} className={className}>
        {render ? render({show, hide}) : children}
      </div>
    </AnimateHeight> 
  );
};

export default Expanding;

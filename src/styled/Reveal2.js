import React, {useState, useRef, useLayoutEffect} from 'react';
import AnimateHeight from 'react-animate-height';
import Conditional from '../form/Reveal';


const StyledReveal = ({children, ...props}) => {
  const ref = useRef();
  useLayoutEffect(() => {
    if (!ref.current || ref.current.clientHeight === 0) {
      setState({collapsed: true})
    }
  },[])
  
  const [state, setState] = useState({});
  
  const onCollapsing = next => {
    setState({collapsed: true, cb: next});
  }
  const onExpanding = next => {
    setState({})
    next();
  }

  // to-do: understand race conditions
  
  return (
    <div ref={ref}>
      <AnimateHeight 
        duration={200}
        height={state.collapsed ? 0 : 'auto'}
        onAnimationEnd={() => {
          if (state.cb) {
            state.cb();
          }
        }}
      >
      <Conditional 
          onCollapsing={onCollapsing}
          onExpanding={onExpanding}
          {...props}>
          {children}
      </Conditional>
        </AnimateHeight> 
    </div>
  );
}

export default StyledReveal;

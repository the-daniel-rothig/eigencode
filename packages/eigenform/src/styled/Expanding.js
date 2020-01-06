import React, { useRef, useLayoutEffect, useState} from 'react';
import AnimateHeight from 'react-animate-height';

const Expanding = ({when, onCollapsed, onExpanding, children, className, bounce = true}) => {
  const divRef = useRef();
  const [childrenMemo, setChildrenMemo] = useState();
  if (when && children !== childrenMemo) {
    setChildrenMemo(children);
  }
  const [state, setState] = useState({collapsed: !!bounce, bounce});
  const [animating, setAnimating] = useState(false);

  useLayoutEffect(() => {
    if (!divRef.current || divRef.current.innerHTML.length === 0) {
      setState({collapsed: true})
    } else {
      setState({collapsed: false})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (when && state.bounce) {
    // edge case: on initial render, we may want for the contents to "bounce up",
    // ie. animate into place. For this to work, AnimateHeight needs to complete one
    // render cycle in the collapsed state, hence the need to set a timeout.
    setTimeout(() => setState({collapsed: false}))
  } else if (when && state.collapsed) {
    if (animating) {
      setState({collapsed: false, multipleAnimations: true});
    } else {
      setState({collapsed: false});
    }
  } else if (!when && !state.collapsed) {
    setState({collapsed: true});
  }

  return (
    <AnimateHeight 
      className='expanding'
      duration={state.multipleAnimations ? 5 : 200}
      height={state.collapsed ? 0 : 'auto'}
      onAnimationStart={({newHeight}) => {
        if (onExpanding && newHeight !== 0) {
          onExpanding();
        }
        setAnimating(true)
      }}
      onAnimationEnd={({newHeight}) => {
        if (newHeight === 0) {
          setChildrenMemo(null);
        }
        if (onCollapsed && newHeight === 0) {
          onCollapsed();
        }
        setAnimating(false)
      }}
    >
      <div className='expanding-layout-reset'/>
      <div ref={divRef} className={className}>
        {childrenMemo}
      </div>
    </AnimateHeight> 
  );
};

export default Expanding;

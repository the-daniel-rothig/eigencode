import React, { useRef, useLayoutEffect, useState} from 'react';
import AnimateHeight from 'react-animate-height';

const Expanding = ({when, onCollapsed, onExpanding, children, className, bounce = true}) => {
  const divRef = useRef();
  const [childrenMemo, setChildrenMemo] = useState();
  if (when && children !== childrenMemo) {
    setChildrenMemo(children);
  }
  const [state, setState] = useState({collapsed: !!bounce});
  const [animating, setAnimating] = useState(false);

  useLayoutEffect(() => {
    if (!divRef.current || divRef.current.innerHTML.length === 0) {
      setState({collapsed: true})
    } else {
      setState({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if(className === "multiple__item") {
    debugger;
  }

  if (when && state.collapsed) {
    if (animating) {
      setTimeout(() => setState({collapsed: false, multipleAnimations: true}))
    } else {
      setTimeout(() => setState({collapsed: false}));
    }
  } else if (!when && !state.collapsed) {
    setTimeout(() => setState({collapsed: true}));
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

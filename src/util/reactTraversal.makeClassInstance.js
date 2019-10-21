
export default function makeClassInstance(element, context) {
  let queue = [];
  let replace = false;
  let updater = {
    isMounted: () => false,
    enqueueForceUpdate: () => null,
    enqueueReplaceState: function(publicInstance, completeState) {
      replace = true;
      queue = [completeState];
    },
    enqueueSetState: function(publicInstance, currentPartialState) {
      if (queue === null) {
        warnNoop(publicInstance, 'setState');
        return null;
      }
      queue.push(currentPartialState);
    },
  };

  const Component = element.type;
  const inst = new Component(element.props, context, updater);
  
  if (typeof Component.getDerivedStateFromProps === 'function') {
    let partialState = Component.getDerivedStateFromProps.call(
      null,
      element.props,
      inst.state,
    ) || {};

    inst.state = {...inst.state, ...partialState}
  } else {
    if (typeof inst.componentWillMount === 'function') {
        inst.componentWillMount();
    }
    if (typeof inst.UNSAFE_componentWillMount === 'function') {
      inst.UNSAFE_componentWillMount();
    }
  }

  inst.props = element.props;
  inst.context = context;
  inst.updater = updater;
  
  if (replace && queue.length === 1) {
    inst.state = queue[0];
  } else {
    let nextState = replace ? queue[0] : inst.state;
    let dontMutate = true;
    for (let i = replace ? 1 : 0; i < queue.length; i++) {
      let partial = queue[i];
      let partialState =
        typeof partial === 'function'
          ? partial.call(inst, nextState, element.props, context)
          : partial;
      if (partialState != null) {
        if (dontMutate) {
          dontMutate = false;
          nextState = Object.assign({}, nextState, partialState);
        } else {
          Object.assign(nextState, partialState);
        }
      }
    }
    inst.state = nextState;
  }

  const child = inst.render();
    
  // if (typeof inst.getChildContext === 'function') {
  //   let childContext = inst.getChildContext();
  //   if (childContext) {
  //     context = Object.assign({}, context, childContext);
  //   }
  // }
  
  return child;
}
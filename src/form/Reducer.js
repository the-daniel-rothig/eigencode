import React from 'react';
import Substituting from '../styled/Substituting';
import debounce from 'lodash/debounce';

const mapElement = (reduce, onFinish) => ({element, memo, getContext, siblingIndex, siblingCount: _siblingCount}) => {
  const idx = siblingIndex || 0;
  const siblingCount = _siblingCount || 1;
  const root = memo ? memo.root : element;
  if (!element || !element.type) {    
    const res = reduce({unbox: () => [], element, getContext, idx, siblingCount, root});
    if (memo) {
      memo.returnValue(res, idx, siblingCount)
    } else {
      onFinish(res)
    }
    return [element, {root}];
  }    
  
  const childrenValues = {}

  const returnValue = (val, index, childrenCount) => {
    childrenValues[index] = val
    // todo: what if a child disappears, eg. becomes null? is that possible w/o parent re-evaluation?
    if (Object.keys(childrenValues).length === childrenCount) {
      const res = reduce({unbox: () => Object.values(childrenValues), element, getContext, idx, siblingCount, root});
      if (memo) {
        memo.returnValue(res, idx, siblingCount)
      } else {
        onFinish(res)
      }
    }
  }
  return [element, {returnValue, root}]
}

const Reducer = ({children, reduce, onFinish}) => {
  const debouncedOnFinish = React.useCallback(
    debounce(onFinish, 100, {leading:false}),
    [onFinish]
  );

  // we want to flush when Reducer has mounted, but in the next render cycle
  // so wrap the debounce flush in a SECOND debounce, but with a shorter timeout
  const flushDebounce = React.useCallback(
    debounce(() => debouncedOnFinish.flush(), 0, {leading: false})
  )

  React.useEffect(() => {
    flushDebounce();
  })

  const map = mapElement(reduce, debouncedOnFinish);
  // wrap children in fragment to ensure there is a root-level element to be reduced.
  return (
    <Substituting mapElement={map}>
      <>{children}</>
    </Substituting>
  )
}

export default Reducer;

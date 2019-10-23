import React from 'react';
import Substituting from '../styled/Substituting';

const mapElement = (reduce, onFinish) => ({element, memo, type, siblingIndex, props}) => {
  const idx = siblingIndex || 0;
  const root = memo ? memo.root : element;
  if (!element || !element.type) {
    if (memo) {
      memo.returnValue(element, idx)
    } else {
      onFinish(element)
    }
  }    
  
  const directChildCount = typeof element.type === "string" || element.type === React.Fragment
    ///*hack*/ || (element.type && element.type.$$typeof && element.type.$$typeof.toString() === "Symbol(react.provider)") /* endo of hack */
    ? React.Children.toArray(props.children).filter(x => x !== undefined).length : 1;
  
  if (directChildCount === 0) {
    const res = reduce({array: [], element, siblingIndex, root});
    if (memo) {
      memo.returnValue(res, idx)
    } else {
      onFinish(res)
    }
  }

  const childrenValues = {}

  const returnValue = (val, index) => {
    childrenValues[index] = val
    if (Object.keys(childrenValues).length === directChildCount) {
      const res = reduce({array: Object.values(childrenValues), element, siblingIndex, root});
      if (memo) {
        memo.returnValue(res, idx)
      } else {
        onFinish(res)
      }
    }
  }
  return [element, {returnValue, root}]
}

// const reducer = ({element, array}) => ...
const Reducer = ({children, reduce, onFinish}) => {
  const map = mapElement(reduce, onFinish);
  
  return (
    <Substituting mapElement={map}>
      <>{children}</>
    </Substituting>
  )
}

export default Reducer
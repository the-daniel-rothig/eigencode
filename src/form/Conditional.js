import React, { useState } from 'react';
import FormContext from './FormContext';
import useFilteredContext from '../hooks/useFilteredContext';
import { mixed } from 'yup';
import InputConfigProvider from './InputConfigProvider';
import useInputRegistry from '../hooks/useInputRegistry';

const invokeCallback = cb => {cb();}

const Conditional = ({when, is, preserveValues, className = '', onExpanding = invokeCallback, onCollapsing = invokeCallback, children}) => {
  const saneWhen = Array.isArray(when) ? when : [when]
  const saneIs = 
      typeof is === 'function' ? is 
    : Array.isArray(is)        ? (...vals) => is.filter((expected, i) => expected !== vals[i]).length > 0
    :                            (...vals) => vals[0] === is;

  const { getValue, deleteValue } = useFilteredContext(FormContext, 1)
  const [inputs, register, deregister] = useInputRegistry();

  const vals = saneWhen.map(x => getValue(x));
  const shouldShow = saneIs(...vals);

  const [targetVisibility, setTargetVisibility] = useState(shouldShow);
  const [effectiveVisibility, setEffectiveVisibility] = useState(shouldShow);

  if (!shouldShow && effectiveVisibility && targetVisibility) {
    setTargetVisibility(false);
    onCollapsing(() => {
      inputs.forEach(i => deleteValue(i.name));
      setEffectiveVisibility(false)
    })
  }

  if (shouldShow && !effectiveVisibility && !targetVisibility) {
    setTargetVisibility(true)
    onExpanding(() => setEffectiveVisibility(true))
  }

  const mapRegister = item => {
    register(item);
    return item.validator ? ({
      ...item,
      validator: mixed().when(when, {is: is, then: item.validator})
    }) : item
  };

  const mapDeregister = preserveValues ? undefined : item => {
    deregister(item);
    return item;
  }

  return (    
      effectiveVisibility ? (
        <InputConfigProvider mapRegister={mapRegister} mapDeregister={mapDeregister}>
          <div className={className}>{children}</div>
        </InputConfigProvider>
      ) : null
  )
}

export default Conditional;
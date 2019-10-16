import React, { useState, useContext } from 'react';
import FormContext from './FormContext';
import useFilteredContext from '../hooks/useFilteredContext';
import { mixed } from 'yup';
import InputConfigProvider from './InputConfigProvider';
import useInputRegistry from '../hooks/useInputRegistry';
import FieldContext from './FieldContext';

const invokeCallback = cb => {cb();}

const Conditional = ({when, is, preserveValues, onExpanding = invokeCallback, onCollapsing = invokeCallback, children}) => {
  const fieldContext = useContext(FieldContext);
  const saneOuterName = fieldContext ? fieldContext.name + "." : "";
  const saneWhen = Array.isArray(when) ? when : [when]
  
  const saneIs = 
      typeof is === 'function' ? is 
    : Array.isArray(is)        ? (...vals) => is.filter((expected, i) => expected !== vals[i]).length > 0
    :                            (...vals) => vals[0] === is;

  const { getValue, deleteValue } = useFilteredContext(FormContext, 1)
  const [inputs, register, deregister] = useInputRegistry();

  const vals = saneWhen.map(x => getValue(saneOuterName + x));
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
    const localName = item.name.substring(saneOuterName.length);
    console.log(!!item.validator, item.name, localName)
    if (/[.[]/.test(localName) || !item.validator) {
      return item;
    }

    return {
      ...item,
      validator: mixed().when(when, {is: is, then: item.validator})
    };
  };

  const mapDeregister = preserveValues ? undefined : item => {
    deregister(item);
    return item;
  }

  return (    
      effectiveVisibility ? (
        <InputConfigProvider mapRegister={mapRegister} mapDeregister={mapDeregister}>
          {children}
        </InputConfigProvider>
      ) : null
  )
}

export default Conditional;
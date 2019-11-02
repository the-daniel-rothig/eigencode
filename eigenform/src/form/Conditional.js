import React, { useState, useContext } from 'react';
import { mixed } from 'yup';

import FieldContext from './FieldContext';
import FormContext from './FormContext';
import InputConfigProvider from './InputConfigProvider';
//import useFilteredContext from '../hooks/';
import useInputRegistry from '../hooks/useInputRegistry';

const invokeCallback = cb => {cb();}

const nullFormContext = {
  getValue: () => undefined,
  deleteValue: () => {}
}

export const isConditionalShowing = (when, is, outerName, getValue)  => {
  const saneWhen = Array.isArray(when) ? when : [when]
  const saneOuterName = outerName ? outerName + "." : "";
    
  const saneIs = 
      typeof is === 'function' ? is 
    : Array.isArray(is)        ? (...vals) => is.filter((expected, i) => expected !== vals[i]).length > 0
    :                            (...vals) => vals[0] === is;

  const vals = saneWhen.map(x => getValue(x.startsWith("$") ? x.substring(1) : saneOuterName + x))
  const shouldShow = saneIs(...vals);

  return shouldShow;
}

const Conditional = ({when, is, preserveValues, onExpanding = invokeCallback, onCollapsing = invokeCallback, children}) => {
  const fieldContext = useContext(FieldContext);
  const saneOuterName = fieldContext ? fieldContext.name + "." : "";
 
  const { getValue, deleteValue } = useContext(FormContext)//useFilteredContext(FormContext, 1) || nullFormContext
  const [inputs, register, deregister] = useInputRegistry();

  const shouldShow = isConditionalShowing(when, is, fieldContext && fieldContext.name, getValue)

  const [targetVisibility, setTargetVisibility] = useState(shouldShow);
  const [effectiveVisibility, setEffectiveVisibility] = useState(shouldShow);

  if (!shouldShow && effectiveVisibility && targetVisibility) {
    setTargetVisibility(false);
    onCollapsing(() => {
      setEffectiveVisibility(false)
    })
  }

  if (shouldShow && !effectiveVisibility && !targetVisibility) {
    setTargetVisibility(true)
    onExpanding(() => setEffectiveVisibility(true))
  }

  if (!effectiveVisibility) {
    inputs.forEach(i => {
      deregister(i);
      deleteValue(i.name)
    });
  }

  const mapRegister = item => {
    register(item);
    const localName = item.name.substring(saneOuterName.length);
    if (/[.[]/.test(localName) || !item.validator) {
      return item;
    }

    return {
      ...item,
      validator: mixed().when(when, {is: is, then: item.validator})
    };
  };

  return (    
      effectiveVisibility ? (
        <InputConfigProvider mapRegister={mapRegister}>
          {children}
        </InputConfigProvider>
      ) : null
  )
}

export default Conditional;
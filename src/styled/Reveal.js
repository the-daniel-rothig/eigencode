import React, {useState} from 'react';
import AnimateHeight from 'react-animate-height';
import useFilteredContext from '../hooks/useFilteredContext';
import InputConfigProvider from './../form/InputConfigProvider';
import FormContext from '../form/FormContext';

import { mixed } from 'yup';

const StyledReveal = (props) => {
  const {when, is, children, preserveValues} = props;
  const saneWhen = Array.isArray(when) ? when : [when]
  const saneIs = 
      typeof is === 'function' ? is 
    : Array.isArray(is)        ? (...vals) => is.filter((expected, i) => expected !== vals[i]).length > 0
    :                            (...vals) => vals[0] === is;

  const { values, setValue } = useFilteredContext(FormContext, 1)

  const vals = saneWhen.map(x => values[x]);
  const shouldShow = saneIs(...vals);

  const [state, setState] = useState(2);

  if (!shouldShow && state > 1) {
    setState(1)
  } else if (shouldShow && state < 2) {
    setState(2)
  }

  const mapRegister = item => item.validator ? ({
    ...item,
    validator: mixed().when(when, {is: is, then: item.validator})
  }) : item;

  const mapDeregister = preserveValues ? undefined : item  => {
    setValue({name: item.name, value: undefined});
    return item;
  }
  
  return (
    <InputConfigProvider mapRegister={mapRegister} mapDeregister={mapDeregister}>
      <AnimateHeight 
        duration={200}
        height={state > 1 ? 'auto' : 0}
        onAnimationEnd={() => {
          if (state === 1) {
            setState(0)
          }
        }}
      >
        {state > 0 && children}
      </AnimateHeight>
    </InputConfigProvider>
  )
}

export default StyledReveal;

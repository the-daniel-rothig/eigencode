import React, { useEffect, useContext } from 'react';
import FieldContext from './FieldContext';
import FormContext from './FormContext';
import InputConfigurationContext from './InputConfigurationContext';

const Radio = ({value, children}) => {
  const { name } = useContext(FieldContext);
  const form = useContext(FormContext);

  const setValue = form ? form.setValue : () => {}
  const getValue = form ? form.getValue : () => '';

  const currentValue = getValue(name);

  const id = [form && form.uid, name, value].filter(Boolean).join("-");

  return (
    <label htmlFor={id}>
      <input type="radio" selected={value === currentValue} value={value} name={name} id={id} onClick={e => setValue(name, e.target.value)}/>
      {children}
    </label>
  );
};

export default Radio;
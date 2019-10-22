import React, { useEffect, useContext } from 'react';
import FieldContext from './FieldContext';
import FormContext from './FormContext';

const InputBase = ({type = 'text'}) => {
  const { name } = useContext(FieldContext);
  const form = useContext(FormContext);

  const getValue = form ? form.getValue : () => {}
  const setValue = form ? form.setValue : () => {}

  const id = [form && form.uid, name].filter(Boolean).join("-");
  useEffect(() => {
    setValue(name, getValue(name) || '')
  },[])

  // The default value ensures the input is controlled from the start
  const value = getValue(name) || '';

  return <input type={type} value={value} name={name} id={id} onChange={e => setValue(name, e.target.value)}/>
}

export default InputBase;
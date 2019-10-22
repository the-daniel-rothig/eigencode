import React, { useContext, useEffect } from 'react';
import FieldContext from './FieldContext';
import FormContext from './FormContext';

const Select = ({options}) => {
  const { name } = useContext(FieldContext);
  const form = useContext(FormContext);

  const setValue = form ? form.setValue : () => {};
  const getValue = form ? form.getValue : () => {};

  const id = [form && form.uid, name].filter(Boolean).join("-");
  useEffect(() => {
    setValue(name, getValue(name) || '')
  },[])

  const value = getValue(name) || '';

  return (
    <select value={value} name={name} id={id} onChange={e => setValue(name, e.target.value)}>
      {options.map(opt => (
        <option value={typeof opt.value === "string" ? opt.value : typeof opt.label === "string" ? opt.label : opt}>
          {typeof opt.label === "string" ? opt.label : opt}
        </option>
      ))}
    </select>
  )
}

export default Select;
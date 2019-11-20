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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const value = getValue(name) || '';

  const saneOptions = options.map(opt => ({
    value: typeof opt.value === "string" ? opt.value : typeof opt.label === "string" ? opt.label : opt.toString(),
    label: typeof opt.label === "string" ? opt.label : opt.toString()
  }))

  return (
    <select value={value} name={name} id={id} onChange={e => setValue(name, e.target.value)}>
      {saneOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

export default Select;
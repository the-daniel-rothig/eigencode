import React, { useContext } from 'react';
import FieldContext from './FieldContext';
import FormContext from './FormContext';

const Checkbox = ({value, className, children}) => {
  const { name } = useContext(FieldContext);
  const form = useContext(FormContext);

  const setValue = form ? form.setValue : () => {}
  const getValue = form ? form.getValue : () => '';

  const currentValue = getValue(name) || [];

  const onClick = (e) => {
    const beforeValue = getValue(name) || [];
    if (e.target.checked) {
      setValue(name, [...beforeValue, e.target.value])
    } else {
      setValue(name, beforeValue.filter(x => x!==e.target.value));
    }
  }

  return (
    <label className={className} onClick={onClick}>
      <input type="checkbox" selected={currentValue.includes(value)} value={value} name={name} />
      {children}
    </label>
  );
};

export default Checkbox;
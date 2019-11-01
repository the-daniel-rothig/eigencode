import React, { useContext } from 'react';
import FieldContext from './FieldContext';
import FormContext from './FormContext';

const Radio = ({value, className, children}) => {
  const { name } = useContext(FieldContext);
  const form = useContext(FormContext);

  const setValue = form ? form.setValue : () => {}
  const getValue = form ? form.getValue : () => '';

  const currentValue = getValue(name);

  return (
    <label className={className} onClick={e => setValue(name, value)}>
      <input type="radio" selected={value === currentValue} value={value} name={name} />
      {children}
    </label>
  );
};

export default Radio;
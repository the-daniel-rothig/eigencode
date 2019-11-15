import React, { useContext } from 'react';
import FieldContext from './FieldContext';
import FormContext from './FormContext';

const Radio = ({value, className, children}) => {
  const { name, setValue, fieldValue } = useContext(FieldContext);
  
  return (
    <label className={className}>
      <input type="radio" checked={value === fieldValue} value={value} name={name} onChange={e => setValue(value)}/>
      {children}
    </label>
  );
};

export default Radio;
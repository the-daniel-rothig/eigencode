import React, { useContext } from 'react';
import FieldContext from './FieldContext';

const Radio = ({value, className, children}) => {
  const { name, setValue, fieldValue } = useContext(FieldContext);
  
  if (fieldValue === undefined || fieldValue === null) {
    setValue('');
  }
  
  return (
    <label className={className}>
      <input type="radio" checked={value === fieldValue} value={value} name={name} onChange={e => setValue(value)}/>
      {children}
    </label>
  );
};

export default Radio;
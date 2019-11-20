import React, { useContext } from 'react';
import FieldContext from './FieldContext';

const Checkbox = ({value, className, children}) => {
  const { name, fieldValue, setValue } = useContext(FieldContext);
  
  const onClick = (e) => {
    const beforeValue = fieldValue || [];
    if (e.target.checked) {
      setValue([...beforeValue, e.target.value])
    } else {
      setValue(beforeValue.filter(x => x!==e.target.value));
    }
  }

  return (
    <label className={className} onClick={onClick}>
      <input type="checkbox" checked={!!fieldValue && fieldValue.includes(value)} value={value} name={name} onChange={() => {}} />
      {children}
    </label>
  );
};

export default Checkbox;
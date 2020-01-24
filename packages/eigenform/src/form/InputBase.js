import React, { useContext } from 'react';
import FieldContext from './FieldContext';

const InputBase = ({type = 'text'}) => {
  const { name, uid, fieldValue, setValue } = useContext(FieldContext);
  const id = [uid, name].filter(Boolean).join("-");
  const value = fieldValue || '';
  if (fieldValue === undefined || fieldValue === null) {
    setValue('');
  }

  return <input type={type} value={value} name={name} id={id} onChange={e => setValue(e.target.value)} />
}

export default InputBase;
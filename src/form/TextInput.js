import React, { useEffect, useContext } from 'react';
import FieldContext from './FieldContext';
import FormContext from './FormContext';
import InputConfigurationContext from './InputConfigurationContext';

const TextInput = () => {
  const { name } = useContext(FieldContext);
  const form = useContext(FormContext);
  // const { register, deregister } = useContext(InputConfigurationContext);

  const id = `${form.uid}-${name}`;

  // useEffect(() => {
  //   const ref = {name};
  //   register(ref);
  //   return () => deregister(ref);
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [name])

  // The default value ensures the input is controlled from the start
  const value = form.getValue(name) || '';

  return <input type="text" value={value} name={name} id={id} onChange={e => form.setValue(name, e.target.value)}/>
}

export default TextInput
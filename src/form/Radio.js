import React, { useEffect, useContext } from 'react';
import FieldContext from './FieldContext';
import FormContext from './FormContext';
import InputConfigurationContext from './InputConfigurationContext';

const Radio = ({value, children}) => {
  const { name } = useContext(FieldContext);
  const form = useContext(FormContext);
  // const { register, deregister } = useContext(InputConfigurationContext);


  const id = `${form.uid}-${name}-${value}`;
  const registeredName = `${name}-${value}`;

  // useEffect(() => {
  //   const ref = {registeredName};
  //   register(ref);
  //   return () => deregister(ref);
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [registeredName])
  

  // useEffect(
  //   registrationEffect({name: registeredName}), 
  //   [registeredName]);
  
  // useEffect(
  //   form.registrationEffect({name: registeredName}),
  //   [registeredName]);

  return (
    <label htmlFor={id}>
      <input type="radio" value={value} name={name} id={id} onClick={e => form.setValue(name, e.target.value)}/>
      {children}
    </label>
  );
};

export default Radio;
import React, { useState } from 'react'
import FormContext from './FormContext';
import makeUid from '../util/makeUid';
import useInputRegistry from '../hooks/useInputRegistry';
import { deepSet, deepGet, deepDelete } from './../util/objectTraversal';
import InputConfigurationContext from './InputConfigurationContext';


const FormProvider = ({id, children, initialValues = {}}) => {
  const uid = id || makeUid()
  const [inputs, register, deregister] = useInputRegistry();
  
  // todo: make work with primitive form objects
  const [values, setState] = useState(initialValues)
  const getValue = name => deepGet(values, name);
  const deleteValue = name => setState({...deepDelete(values, name)})
  const setValue = (name, value) => setState({...deepSet(values, name, value)})
  
  return (
    <InputConfigurationContext.Provider value={{inputs, register, deregister}}>
      <FormContext.Provider value={{uid, values, setValue, getValue, deleteValue}}>
        {children}
      </FormContext.Provider>
    </InputConfigurationContext.Provider>
  );
}

const Form = ({id, children, initialValues}) => {

  return (
    <form id={id}>
      <FormProvider initialValues={initialValues}>
        {children}
      </FormProvider>
    </form>
  )
}

export default Form;
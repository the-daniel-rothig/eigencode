import React, { useState, useContext } from 'react'
import FormContext from './FormContext';
import makeUid from '../util/makeUid';
import useInputRegistry from '../hooks/useInputRegistry';
import { deepSet, deepGet, deepDelete } from './../util/objectTraversal';
import InputConfigurationContext from './InputConfigurationContext';

//import { object } from 'yup';

const FormProvider = ({id, children}) => {
  const uid = id || makeUid()
  const [inputs, register, deregister] = useInputRegistry();
  
  // todo: make work with primitive form objects
  const [values, setState] = useState({})
  const getValue = name => deepGet(values, name);
  const deleteValue = name => setState({...deepDelete(values, name)})
  const setValue = (name, value) => setState({...deepSet(values, name, value)})
  
  return (
    <InputConfigurationContext.Provider value={{inputs, register, deregister}}>
      <FormContext.Provider value={{uid, values, setValue, getValue, deleteValue}}>
        {children}
        <Debug />
      </FormContext.Provider>
    </InputConfigurationContext.Provider>
  );
}

const Debug = () => {
  //const { inputs } = useContext(InputConfigurationContext);
  const { values } = useContext(FormContext);

  // const shape = {};
  // inputs.filter(i => i.validator).forEach(i => deepSet(shape, i.name, i.validator));

  // const validationSchema = object().shape(shape);

  // try {
  //   validationSchema.validateSync(values);
  // } catch(e) {
  //   return (<pre>
  //   {e.message}</pre>)
  // }

  return (<pre>
    {JSON.stringify(values, null, '  ')}</pre>)
}

const Form = ({id, children}) => {

  return (
    <form id={id}>
      <FormProvider>
        {children}
      </FormProvider>
    </form>
  )
}

export default Form;
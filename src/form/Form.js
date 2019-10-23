import React, { useState, useContext } from 'react'
import FormContext from './FormContext';
import makeUid from '../util/makeUid';
import useInputRegistry from '../hooks/useInputRegistry';
import { deepSet, deepGet, deepDelete } from './../util/objectTraversal';
import InputConfigurationContext from './InputConfigurationContext';

import { object, array } from 'yup';

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
        <Debug />
      </FormContext.Provider>
    </InputConfigurationContext.Provider>
  );
}

const Debug = () => {
  const { inputs } = useContext(InputConfigurationContext);
  const { values } = useContext(FormContext);

  const shape = {};
  inputs.filter(i => i.validator).map(i => ({
    validator: i.validator,
    path: i.name.replace(/\[[0-9]+\]/g, "[]").split(".").filter(Boolean)
  })).forEach(({validator, path}) => {
    let target = shape;
    path.slice(0, -1).forEach(p => {
      target[p] = target[p] || {};
      target = target[p];
    })
    target[path[path.length -1]] = validator;
  })

  const toSchema = obj => {
    if (obj.__isYupSchema__) {
      return obj;
    }
    const s = {}
    Object.keys(obj).forEach(key => {
      if (key.endsWith("[]")) {
        s[key.slice(0, -2)] = array().of(toSchema(obj[key]));
      } else {
        s[key] = toSchema(obj[key])
      }
    })

    return object().shape(s)
  }

  const validationSchema = toSchema(shape);

  let message = 'ok';

  try {
    validationSchema.validateSync(values, {context: values});
  } catch(e) {
    message = e.message
  }

  return (<pre>{message}


    {JSON.stringify(values, null, '  ')}</pre>)
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
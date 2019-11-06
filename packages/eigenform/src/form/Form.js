import React, { useState, useRef, useContext } from 'react'
import { deepSet, deepGet, deepDelete } from 'eigencode-shared-utils';
import FormContext from './FormContext';
import makeUid from '../util/makeUid';
import ValidationScope from './ValidationScope';
import ValidationScopeContext from './ValidationScopeContext';
import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual'

const FormProvider = ({id, children, initialValues = {}}) => {
  console.log('rendering FormProvider')
  const uid = useRef(id || makeUid()).current;
  
  const { runValidation } = useContext(ValidationScopeContext);
  const throttlededRunValidation = useRef(throttle(runValidation, 100));
  
  const [values, setState] = useState(initialValues)
  const getValue = name => deepGet(values, name);
  const deleteValue = name => setState({...deepDelete(values, name)})
  const setValue = (name, value) => {
    console.log('setValueCalled')
    if (!isEqual(deepGet(values, name), value)) {
      const newValues = {...deepSet(values, name, value)}
      throttlededRunValidation.current(newValues);
      setState(newValues);
    }
  }
  
  return (
      <FormContext.Provider value={{uid, values, setValue, getValue, deleteValue}}>
          {children}
      </FormContext.Provider>
  );
}

const Form = ({id, children, initialValues, isComplete=true}) => {
  
  return (
    <form id={id}>
      <ValidationScope isComplete={isComplete}>
        <FormProvider initialValues={initialValues}>
          {children}
        </FormProvider>
      </ValidationScope>
    </form>
  )
}

export default Form;
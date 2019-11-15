import React, { useState, useRef, useContext } from 'react'
import { deepSet, deepGet, deepDelete } from 'eigencode-shared-utils';
import FormContext from './FormContext';
import makeUid from '../util/makeUid';
import ValidationScope from './ValidationScope';
import ValidationScopeContext from './ValidationScopeContext';
import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual'

const FormProvider = ({id, children, initialValues = {}}) => {
  const uid = useRef(id || makeUid()).current;
  const [updateForcingState, setUpdateForcingState] = useState(false);
  const forceUpdate = () => {
    setUpdateForcingState(!updateForcingState);
  }
  
  const { runValidation } = useContext(ValidationScopeContext);
  const throttlededRunValidation = useRef(throttle(runValidation, 1000));
  
  const valuesRef = useRef(initialValues);
  const getValue = name => deepGet(valuesRef.current, name); // todo: clone
  const deleteValue = name => {
    deepDelete(valuesRef.current, name);
    throttlededRunValidation.current(valuesRef.current);
    forceUpdate();
  };

  const setValue = (name, value) => {
    if (!isEqual(deepGet(valuesRef.current, name), value)) {
      deepSet(valuesRef.current, name, value);
      throttlededRunValidation.current(valuesRef.current);
      forceUpdate();
    }
  };
  
  return (
      <FormContext.Provider value={{uid, setValue, getValue, deleteValue}}>
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
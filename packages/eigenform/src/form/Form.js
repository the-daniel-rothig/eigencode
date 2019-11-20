import React, { useCallback, useRef, useContext, useReducer } from 'react'
import { deepSet, deepGet, deepDelete } from 'eigencode-shared-utils';
import FormContext from './FormContext';
import makeUid from '../util/makeUid';
import ValidationScope from './ValidationScope';
import ValidationScopeContext from './ValidationScopeContext';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';

const FormProvider = ({id, children, initialValues = {}}) => {
  const uid = useRef(id || makeUid()).current;
  
  const [values, dispatch] = useReducer((state,action) => {
    const { value, name, type } = action;
    switch(type) {
      case 'delete':
        deepDelete(state, name);
        return {...state}
      case 'set': 
        deepSet(state, name, value);
        return {...state}
      default: throw 'boo' 
    }
  }, initialValues);

  const { runValidation } = useContext(ValidationScopeContext);
  const throttlededRunValidation = useCallback(debounce(runValidation, 40, {leading: false}), [runValidation]);

  throttlededRunValidation(values)
    
  const getValue = useCallback(name => cloneDeep(deepGet(values, name)), [values]);
  const deleteValue = useCallback((name) => {
    //throttlededRunValidation(values)
    dispatch({
      type: 'delete',
      name
    })
  }, [throttlededRunValidation, values])

  const setValue = useCallback((name, value) => {
    //throttlededRunValidation(values)
    dispatch({
      type: 'set',
      name,
      value
    })
  }, [throttlededRunValidation, values]);
  
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
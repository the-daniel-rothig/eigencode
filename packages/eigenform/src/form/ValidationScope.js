import React, { useState, useContext, useCallback } from 'react';
import { Reducer }  from 'react-traversal';
import extractValidationSchema from '../reducers/extractValidationSchema';
import ValidationScopeContext from './ValidationScopeContext';
import FieldContext from './FieldContext';
import { deepGet } from 'eigencode-shared-utils';
import isEqual from 'lodash/isEqual';

const ValidationScopeOuter = ({children, isComplete}) => {
  const [errors, setErrors] = useState([]);
  const fieldContext = useContext(FieldContext);
  const [schemaState, setSchemaState] = useState(undefined);

  const runValidation = useCallback(value => {
    if (!schemaState) {
      return
    }
    const relaxedSchema = !isComplete && schemaState._type === "object" ? schemaState.unknown() : schemaState;
    const reachValue = fieldContext && fieldContext.name
      ? deepGet(value, fieldContext.name)
      : value;

    return relaxedSchema.validate(reachValue, {context: reachValue, abortEarly: false, stripUnknown: !isComplete})
      .then((v) => {
        setErrors(e => e.length === 0 ? e : []);
        return v;
      })
      .catch(e => {
        const errors = e.inner.map(({path, message}) => ({path, message}));
        setErrors(e => isEqual(e,errors) ? e : errors);
      });
  }, [schemaState, isComplete, fieldContext]);

  const setSchema = newSchema => setSchemaState(oldSchema => 
    extractValidationSchema.shouldUpdate(oldSchema, newSchema) ? newSchema : oldSchema  
  );

  return (
    <ValidationScopeContext.Provider value={{runValidation, errors, setSchema}}>
      {children}
    </ValidationScopeContext.Provider>
  );
}

const ValidationScopeInner = ({children}) => {
  // big ol' hack... don't do this at home
  const ctx = ValidationScopeContext._currentValue;
  return (
  <Reducer reducerFunction={extractValidationSchema} onFinish={ctx.setSchema}>
    {children}
  </Reducer> 
  )
}

const ValidationScope = ({children, isComplete}) => (
  <ValidationScopeOuter isComplete={isComplete}>
    <ValidationScopeInner>
      {children}
    </ValidationScopeInner>
  </ValidationScopeOuter>
)

export default ValidationScope;
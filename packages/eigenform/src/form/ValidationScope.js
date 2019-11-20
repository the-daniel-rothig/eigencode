import React, { useState, useRef, useContext, useCallback } from 'react';
import { Reducer2 }  from 'react-traversal';
import extractValidationSchema from '../reducers/extractValidationSchema';
import ValidationScopeContext from './ValidationScopeContext';
import useDeferredCallback from '../hooks/useDeferredCallback';
import { toSchema } from 'yup-fragment';
import FieldContext from './FieldContext';
import { deepGet } from 'eigencode-shared-utils';
import isEqual from 'lodash/isEqual';

const ValidationScopeOuter = ({children, isComplete}) => {
  const [errors, setErrors] = useState([]);
  const setErrorsIfNotEqual = e => {
    if (!isEqual(e, errors)) {
      setErrors(e);
    }
  }

  const fieldContext = useContext(FieldContext);

  const doRunValidation = (schema, value) => {
    const relaxedSchema = !isComplete && schema._type === "object" ? schema.unknown() : schema;
    const reachValue = fieldContext && fieldContext.name
      ? deepGet(value, fieldContext.name)
      : value;

    return relaxedSchema.validate(reachValue, {context: reachValue, abortEarly: false, stripUnknown: !isComplete})
      .then((v) => {
        setErrorsIfNotEqual([])
        return v;
      })
      .catch(e => {
        setErrorsIfNotEqual(e.inner.map(({path, message}) => ({path, message})));
      });
  }

  const [schemaState, setSchemaState] = useState(undefined);
  const runValidation = useCallback(value => {
    if (schemaState) {
      doRunValidation(schemaState, value)
    }
  }, [schemaState, errors]);

  const setSchema = setSchemaState;

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
  <Reducer2 reducerFunction={extractValidationSchema} onFinish={ctx.setSchema}>
    {children}
  </Reducer2> 
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
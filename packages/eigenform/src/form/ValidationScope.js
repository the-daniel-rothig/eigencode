import React, { useState, useContext, useCallback } from 'react';
import { Reducer }  from 'react-traversal';
import extractValidationSchema from '../reducers/extractValidationSchema';
import ValidationScopeContext from './ValidationScopeContext';
import useDeferredCallback from '../hooks/useDeferredCallback';
import { toSchema } from 'yup-fragment';
import FieldContext from './FieldContext';
import { deepGet } from 'eigencode-shared-utils';
import isEqual from 'lodash/isEqual';

const ValidationScopeOuter = ({children, isComplete}) => {
  const [errors, setErrors] = useState();
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
        setErrorsIfNotEqual(undefined)
        return v;
      })
      .catch(e => {
        setErrorsIfNotEqual(e.inner.map(({path, message}) => ({path, message})));
      });
  }

  
  const [runValidation, schema, setSchemaForCallback] = useDeferredCallback(doRunValidation, [fieldContext && fieldContext.name]);
  const setSchema = useCallback(s => {
    if (!schema || !isEqual(schema.describe(), toSchema(s).describe())) {
      setSchemaForCallback(toSchema(s))
    } else {
    }
  }, [schema]);

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
  <Reducer reduce={extractValidationSchema.reduce} onFinish={ctx.setSchema}>
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
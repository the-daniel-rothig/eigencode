import React, { useState, useContext } from 'react';
import { Reducer }  from 'react-traversal';
import extractValidationSchema from '../reducers/extractValidationSchema';
import ValidationScopeContext from './ValidationScopeContext';
import useDeferredCallback from '../hooks/useDeferredCallback';
import { toSchema } from 'yup-fragment';
import FieldContext from './FieldContext';
import { deepGet } from 'eigencode-shared-utils';


const ValidationScope = ({children, isComplete}) => {
  const [errors, setErrors] = useState();
  const fieldContext = useContext(FieldContext);

  const doRunValidation = (schema, value) => {
    const relaxedSchema = !isComplete && schema._type === "object" ? schema.unknown() : schema;
    const reachValue = fieldContext && fieldContext.name
      ? deepGet(value, fieldContext.name)
      : value;

    return relaxedSchema.validate(reachValue, {context: reachValue, abortEarly: false, stripUnknown: !isComplete})
      .then((v) => {
        setErrors(undefined)
        return v;
      })
      .catch(e => {
        setErrors(e.inner.map(({path, message}) => ({path, message})));
      });
  }

  const [runValidation, setSchema] = useDeferredCallback(doRunValidation, [fieldContext && fieldContext.name]);

  return (
    <ValidationScopeContext.Provider value={{runValidation, errors}}>
      <Reducer reduce={extractValidationSchema.reduce} onFinish={s => setSchema(toSchema(s))}>
        {children}
      </Reducer>
    </ValidationScopeContext.Provider>
  );
}

export default ValidationScope;
import React, { useState, useContext, useCallback } from 'react';
import { CustomRenderer }  from 'react-custom-renderer';
import extractValidationSchema, { shemasAreEqual } from '../reducers/extractValidationSchema';
import ValidationScopeContext from './ValidationScopeContext';
import GroupContext from './GroupContext';
import { deepGet } from 'eigencode-shared-utils';
import isEqual from 'lodash/isEqual';

const ValidationScopeOuter = ({children, isComplete}) => {
  const [errors, setErrors] = useState([]);
  const groupContext = useContext(GroupContext);
  const [schemaState, setSchemaState] = useState(undefined);

  const runValidation = useCallback(value => {
    if (!schemaState) {
      return
    }
    const relaxedSchema = !isComplete && schemaState._type === "object" ? schemaState.unknown() : schemaState;
    const reachValue = groupContext && groupContext.name
      ? deepGet(value, groupContext.name)
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
  }, [schemaState, isComplete, groupContext]);

  const setSchema = newSchema => setSchemaState(oldSchema => 
    shemasAreEqual(oldSchema, newSchema) ? oldSchema : newSchema  
  );

  return (
    <ValidationScopeContext.Provider value={{runValidation, errors, setSchema}}>
      {children}
    </ValidationScopeContext.Provider>
  );
}

const ValidationScopeInner = ({children, dynamicUpdate}) => {
  // big ol' hack... don't do this at home
  const ctx = ValidationScopeContext._currentValue;
  
  if (!dynamicUpdate) {
    const validationSchema = extractValidationSchema.render(
      <>{children}</>);
    ctx.setSchema(validationSchema);

    return children;
  } else {
    return (
      <CustomRenderer customRenderFunction={extractValidationSchema} onFinish={ctx.setSchema}>
        {children}
      </CustomRenderer> 
    )
  }
}

const ValidationScope = ({children, isComplete, dynamicUpdate}) => (
  <ValidationScopeOuter isComplete={isComplete}>
    <ValidationScopeInner dynamicUpdate={dynamicUpdate}>
      {children}
    </ValidationScopeInner>
  </ValidationScopeOuter>
)

export default ValidationScope;
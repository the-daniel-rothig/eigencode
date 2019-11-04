import React, { useContext } from 'react';
import FieldContext from './FieldContext';
import ValidationScopeContext from './ValidationScopeContext';

const FieldFeedback = ({children}) => {
  const field = useContext(FieldContext);
  const validation = useContext(ValidationScopeContext);
  
  const error = field && validation && validation.errors.find(x => x.path === field.name);
  const errorMessage = error ? error.message : null;
  
  if (typeof children === "function") {
    return children(errorMessage);
  } else if (errorMessage) {
    return <span className="field-feedback">{errorMessage}</span>
  } else {
    return null;
  }
}

export default FieldFeedback;
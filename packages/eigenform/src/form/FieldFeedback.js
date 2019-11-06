import React, { useContext } from 'react';
import FieldContext from './FieldContext';
import ValidationScopeContext from './ValidationScopeContext';

const sentenceCase = x => x.substring(0,1).toUpperCase() + x.substring(1);

const FieldFeedback = ({render}) => {
  const field = useContext(FieldContext);
  const validation = useContext(ValidationScopeContext);
  
  const error = field && validation && validation.errors && validation.errors.find(x => x.path === field.name);
  const errorMessage = sentenceCase(error ? error.message : "");
  
  if (typeof render === "function") {
    return render(errorMessage);
  } else if (errorMessage) {
    return <span className="field-feedback">{errorMessage}</span>
  } else {
    return null;
  }
}

export default FieldFeedback;
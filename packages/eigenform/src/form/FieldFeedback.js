import React, { useContext } from 'react';
import FieldContext from './FieldContext';
import ValidationScopeContext from './ValidationScopeContext';

const sentenceCase = x => x.substring(0,1).toUpperCase() + x.substring(1);

export const useFieldFeedback = () => {
  const field = useContext(FieldContext);
  const validation = useContext(ValidationScopeContext);
  
  const error = field && validation && validation.errors && validation.errors.find(x => x.path === field.name);
  const errorMessage = sentenceCase(error ? error.message : "");
  
  return errorMessage;
}

const FieldFeedbackUsingContext = () => {
  const errorMessage = useFieldFeedback();
  return <FieldFeedback>{errorMessage || null}</FieldFeedback>
}

const FieldFeedback = ({children}) => {
  if (children === undefined) {
    return <FieldFeedbackUsingContext />
  }

  if (children) {
    return <span className="field-feedback">{children}</span>
  } else {
    return null;
  }
}

export default FieldFeedback;
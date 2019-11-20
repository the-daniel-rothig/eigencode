import React, { useContext } from 'react';
import ValidationScopeContext from './ValidationScopeContext';
import FormContext from './FormContext';

const FormValidatingButton = React.forwardRef(({children, className}, ref) => {
  /// todo: guard clauses
  const { runValidation } = useContext(ValidationScopeContext);
  const form = useContext(FormContext);
  const isFunc = typeof children === "function";

  const onClick = () => runValidation(form.getValue(''));
  
  if (isFunc) {
    return children(onClick);
  } else {
    return <button type="button" className={className} onClick={onClick} ref={ref}>{children}</button>
  }
});

export default FormValidatingButton;
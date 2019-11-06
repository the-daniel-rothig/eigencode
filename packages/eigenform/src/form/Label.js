import React, { useContext } from 'react'
import FieldContext from './FieldContext'
import FormContext from './FormContext';
import InputConfigurationContext from './InputConfigurationContext';

const Label = ({children}) => {
  const { name } = useContext(FieldContext);
  const { uid } = useContext(FormContext);
  //const { localInputs } = useContext(InputConfigurationContext);

  const hasSetTypeFields = false; //localInputs.length > 1

  const Tag = hasSetTypeFields ? 'legend' : 'label';
  const htmlFor = hasSetTypeFields ? '' : `${uid}-${name}`;

  return (
    <Tag name={name} htmlFor={htmlFor}>
      {children}
    </Tag>
  );
};

export default Label;
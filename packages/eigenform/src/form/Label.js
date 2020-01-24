import React, { useContext } from 'react'
import FieldContext from './FieldContext'

const Label = ({children}) => {
  const fieldContext = useContext(FieldContext);
  const name = fieldContext ? fieldContext.name : '';
  const uid = fieldContext ? fieldContext.uid : '';
  
  const hasSetTypeFields = false; //todo

  const Tag = hasSetTypeFields ? 'legend' : 'label';
  const htmlFor = hasSetTypeFields ? '' : `${uid}-${name}`;

  return (
    <Tag name={name} htmlFor={htmlFor}>
      {children}
    </Tag>
  );
};

export default Label;
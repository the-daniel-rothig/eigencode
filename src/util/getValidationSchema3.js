import React from 'react';
import { object, mixed } from 'yup';
import extractValidationSchema from '../reduces/extractValidationSchema';
import Reducer from '../form/Reducer';

const GetValidationSchema = ({children, onFinish}) => {
  const wrappedOnFinish = reduced => {
    const { allowedValues, namedSchemas, schema } = reduced;
    const combined =  namedSchemas && schema ? schema.concat(object().shape(namedSchemas).noUnknown().strict()) :
                      namedSchemas ? object().shape(namedSchemas).noUnknown().strict() :
                      schema;
  
    const combined1 = combined && allowedValues ? combined.oneOf(allowedValues) :
                      allowedValues ? mixed().oneOf(allowedValues) :
                      combined;
  
    return onFinish(combined1);
  }

  return (
    <Reducer reduce={extractValidationSchema} onFinish={wrappedOnFinish}>
      {children}
    </Reducer>
  )
}

export default GetValidationSchema;
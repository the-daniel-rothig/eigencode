import React from 'react';
import { object, mixed } from 'yup';
import extractValidationSchema from '../reduces/extractValidationSchema';
import Reducer from '../form/Reducer';

import throttle from 'lodash/throttle';

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
    <Reducer reduce={extractValidationSchema} onFinish={throttle(wrappedOnFinish,0, {leading: false})}>
      {children}
    </Reducer>
  )
}

export default GetValidationSchema;
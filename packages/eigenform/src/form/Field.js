import React, { useContext, useEffect } from 'react'
import { combineObjectPaths } from 'eigencode-shared-utils';
import FieldContext from './FieldContext'
import makeCamelCaseFieldName from '../util/makeCamelCaseFieldName';

export const FieldProvider = ({name = "", children, validator}) => {
  
  if (name.startsWith("$")) {
    throw new Error(`Field name ${name} is not allowed: name must not start with "$"`)
  }
  const outer = useContext(FieldContext);
  const fullyQualifiedName = combineObjectPaths(outer && outer.name, name);

  return (
      <FieldContext.Provider value={{name: fullyQualifiedName}}>
          {children}
      </FieldContext.Provider>
  )
}

const FieldTag = ({className, tag, children}) => {
  const Tag = !!tag ? tag 
    : className ? 'div' : React.Fragment;
    
  const props = Tag !== React.Fragment ? {className} : {}

  return (
      <Tag {...props}>{children}</Tag>
  );
}

const Field = ({className, tag, children, name, ...rest}) => (
  <FieldProvider name={makeCamelCaseFieldName(name)} {...rest}>
    <FieldTag tag={tag} className={className}>{children}</FieldTag>
  </FieldProvider>
)


export default Field;
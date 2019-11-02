import React, { useContext, useEffect } from 'react'
import { combineObjectPaths } from 'eigencode-shared-utils';
import FieldContext from './FieldContext'
import InputConfigProvider from './InputConfigProvider';
import InputConfigurationContext from './InputConfigurationContext';
import makeCamelCaseFieldName from '../util/makeCamelCaseFieldName';

const Inner = ({children}) => {
  const { register, deregister } = useContext(InputConfigurationContext);
  const { name } = useContext(FieldContext);
  
  useEffect(() => {
    const ref = {name};
    register(ref);
    return () => deregister(ref);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  return <>{children}</>
}

export const FieldProvider = ({name = "", children, validator}) => {
  
  if (name.startsWith("$")) {
    throw new Error(`Field name ${name} is not allowed: name must not start with "$"`)
  }
  const outer = useContext(FieldContext);
  const fullyQualifiedName = combineObjectPaths(outer && outer.name, name);

  return (
    <InputConfigProvider mapRegister={item => ({...item, validator: validator || item.validator})} >
      <FieldContext.Provider value={{name: fullyQualifiedName}}>
        <Inner>
          {children}
        </Inner>
      </FieldContext.Provider>
    </InputConfigProvider>
  )
}

const FieldTag = ({className, tag, children}) => {
  const { localInputs } = useContext(InputConfigurationContext);
  
  const Tag = !!tag ? tag 
    : localInputs.length > 1 ? 'fieldset' 
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
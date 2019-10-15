import React, { useContext, useEffect } from 'react'
import FieldContext from './FieldContext'
import InputConfigProvider from './InputConfigProvider';
import InputConfigurationContext from './InputConfigurationContext';
import { combineObjectPaths } from '../util/objectTraversal';

const Inner = ({children, className}) => {
  const { localInputs, register, deregister } = useContext(InputConfigurationContext);
  const { name } = useContext(FieldContext);
  
  useEffect(() => {
    const ref = {name};
    register(ref);
    return () => deregister(ref);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  const Tag = localInputs.length > 1 ? 'fieldset' 
    : className ? 'div' : React.Fragment;
  const props = Tag !== React.Fragment ? {className} : {}
    
  return <Tag {...props}>{children}</Tag>
}

const Field = ({name, children, className, validator}) => {
  const outer = useContext(FieldContext);
  const fullyQualifiedName = combineObjectPaths(outer && outer.name, name);

  return (
    <InputConfigProvider mapRegister={item => ({...item, validator: validator})} >
      <FieldContext.Provider value={{name: fullyQualifiedName}}>
        <Inner className={className}>
          {children}
        </Inner>
      </FieldContext.Provider>
    </InputConfigProvider>
  )
}



export default Field;
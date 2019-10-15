import React, { useContext, useEffect } from 'react';
import FormContext from './FormContext';
import Field from './Field';
import FieldContext from './FieldContext';
import InputConfigurationContext from './InputConfigurationContext';
import { combineObjectPaths } from './../util/objectTraversal';

const SingleItem = ({index, className, remove, children}) => {
  const WrapperTag = className ? ({children}) => <div className='className'>{children}</div> : React.Fragment;
  
  return (    
    <WrapperTag>
      <Field name={`[${index}]`}>
          {children}
          {(remove) && (
            <button onClick={remove}>Remove</button>
          )}
      </Field>
    </WrapperTag>
  )
}
const Multiple = ({children, className, name, min=1, max}) => {
  const outer = useContext(FormContext);

  const arr = outer.getValue(name) || [];
  
  const fieldContext = useContext(FieldContext);
  //const { register, deregister } = useContext(InputConfigurationContext);
  const fullyQualifiedName = combineObjectPaths(fieldContext && fieldContext.name, name);

  useEffect(() => {
    if (arr.length < min) {
      outer.setValue(
        fullyQualifiedName,
        [...(new Array(min))].map((v, i) => arr[i] || null)
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // useEffect(() => {
  //   const ref = {name: fullyQualifiedName};
  //   register(ref);
  //   return () => deregister(ref);
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [fullyQualifiedName])

  const add = (e) => {
    e.preventDefault()
    outer.setValue(fullyQualifiedName, [...arr, null]);
  }

  const removeAt = idx => e => {
    e.preventDefault()
    outer.deleteValue(`${fullyQualifiedName}[${idx}]`);
  }
  
  return (
    <Field name={name}>
      {arr.map((v, i) => (
        <SingleItem 
          key={i} 
          index={i} 
          className={className}
          remove={!min || arr.length > min ? removeAt(i) : undefined}
        >{children}</SingleItem>
      ))}
      {(!max || arr.length < max) &&(
        <button onClick={add}>Add another</button>
      )}
    </Field>
  )
}

export default Multiple;

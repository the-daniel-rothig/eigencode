import React, { useContext, useEffect, useState } from 'react';
import { combineObjectPaths } from 'eigencode-shared-utils';
import { FieldProvider } from './Field';
import FieldContext from './FieldContext';
import FormContext from './FormContext';
import makeUid from '../util/makeUid';

const SingleItem = ({remove, children}) => {
  return (
    <>    
      {children}
      {(remove) && (
        <button type='button' onClick={remove}>Remove</button>
      )}
    </>
  )
}

const Multiple = ({children, className, name, min=1, max, renderItem = SingleItem}) => {
  const outer = useContext(FormContext);
  const setValue = outer ? outer.setValue : () => {};
  const deleteValue = outer ? outer.deleteValue : () => {};

  const arr = (outer ? outer.getValue(name) : []) || [];
  const [uids, setUids]= useState(arr.map(() => makeUid()))
  
  const fieldContext = useContext(FieldContext);
  const fullyQualifiedName = combineObjectPaths(fieldContext && fieldContext.name, name);

  useEffect(() => {
    if (min && arr.length < min) {
      setValue(
        fullyQualifiedName,
        [...(new Array(min))].map((v, i) => arr[i] || null)
      )
      setUids([...(new Array(min))].map(() => makeUid()))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const add = (e) => {
    e.preventDefault()
    uids.push(makeUid())
    setValue(fullyQualifiedName, [...arr, null]);
  }

  const removeAt = idx => e => {
    //e.preventDefault()
    console.log('remove idx = '+idx)
    uids.splice(idx, 1);
    deleteValue(`${fullyQualifiedName}[${idx}]`);
  }

  const RenderItem = renderItem;
  
  return (
    <FieldProvider name={name}>
      {uids.map((v, i) => (
        <FieldProvider name={`[${i}]`} key={v}>
          <RenderItem 
            index={i}
            className={className}
            remove={!min || arr.length > min ? removeAt(i) : undefined}
          >{children}</RenderItem>
        </FieldProvider>
      ))}
      {(!max || arr.length < max) &&(
        <button type='button' onClick={add}>Add another</button>
      )}
    </FieldProvider>
  )
}

export default Multiple;

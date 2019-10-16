import React, { useContext, useEffect, useState } from 'react';
import FormContext from './FormContext';
import { FieldProvider } from './Field';
import FieldContext from './FieldContext';
import { combineObjectPaths } from './../util/objectTraversal';
import makeUid from '../util/makeUid';
import Button from './../styled/Button';

const SingleItem = ({remove, children}) => {
  return (
    <>    
      {children}
      {(remove) && (
        <Button onClick={remove}>Remove</Button>
      )}
    </>
  )
}

const Multiple = ({children, className, name, min=1, max, renderItem = SingleItem}) => {
  const outer = useContext(FormContext);

  const arr = outer.getValue(name) || [];
  const [uids, setUids]= useState(arr.map(() => makeUid()))
  
  const fieldContext = useContext(FieldContext);
  const fullyQualifiedName = combineObjectPaths(fieldContext && fieldContext.name, name);

  useEffect(() => {
    if (min && arr.length < min) {
      outer.setValue(
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
    outer.setValue(fullyQualifiedName, [...arr, null]);
  }

  const removeAt = idx => e => {
    //e.preventDefault()
    console.log('remove idx = '+idx)
    uids.splice(idx, 1);
    outer.deleteValue(`${fullyQualifiedName}[${idx}]`);
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
        <Button onClick={add}>Add another</Button>
      )}
    </FieldProvider>
  )
}

export default Multiple;

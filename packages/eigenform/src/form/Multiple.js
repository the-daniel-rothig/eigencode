import React, { useContext, useEffect, useRef } from 'react';
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
  const uids = useRef(arr.map(() => makeUid()))
  
  const fieldContext = useContext(FieldContext);
  const fullyQualifiedName = combineObjectPaths(fieldContext && fieldContext.name, name);

  useEffect(() => {
    if (min && arr.length < min) {
      uids.current = [...(new Array(min))].map(() => makeUid());
      setValue(
        fullyQualifiedName,
        [...(new Array(min))].map((v, i) => arr[i] || null)
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const add = (e) => {
    uids.current.push(makeUid())
    if (outer) {
      const arrx = outer.getValue(name);
      outer.setValue(fullyQualifiedName, [...arrx, null]);
    }
  }

  const removeAt = idx => e => {
    uids.current.splice(idx, 1);
    if (outer) {
      const arrx = outer.getValue(name);
      setValue(fullyQualifiedName, [...arrx.filter((x, i) => i !== idx)]);
    }
  }

  const RenderItem = renderItem;

  return (
    <FieldProvider name={name}>
      {uids.current.map((v, i) => (
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

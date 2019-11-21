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

const NEW_ITEM_VALUE = () => ({});

const Multiple = ({children, className, name, min=1, max, renderItem = SingleItem}) => {
  const outer = useContext(FormContext);
  const setValue = outer ? outer.setValue : () => {};

  const arr = (outer ? outer.getValue(name) : []) || [];
  const [uids, setUids] = useState(arr.map(() => makeUid()));
  
  const fieldContext = useContext(FieldContext);
  const fullyQualifiedName = combineObjectPaths(fieldContext && fieldContext.name, name);

  useEffect(() => {
    if (min && arr.length < min) {
      setUids([...(new Array(min))].map(() => makeUid()));
      setValue(
        fullyQualifiedName,
        [...(new Array(min))].map((v, i) => arr[i] || NEW_ITEM_VALUE())
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const add = (e) => {
    setUids(oldUids => [...oldUids, makeUid()]);
    if (outer) {
      const arrx = outer.getValue(name);
      outer.setValue(fullyQualifiedName, [...arrx, NEW_ITEM_VALUE()]);
    }
  }

  const removeAt = idx => e => {
    setUids(oldUids => oldUids.filter((_, i) => i !== idx));
    if (outer) {
      const arrx = outer.getValue(name);
      setValue(fullyQualifiedName, [...arrx.filter((x, i) => i !== idx)]);
    }
  }

  const RenderItem = renderItem;

  const canAdd = !max || uids.length < max;
  const canRemove = !min || uids.length > min;

  return (
    <FieldProvider name={name}>
      {uids.map((v, i) => (
        <FieldProvider name={`[${i}]`} key={v}>
          <RenderItem 
            index={i}
            className={className}
            remove={canRemove ? removeAt(i) : undefined}
          >{children}</RenderItem>
        </FieldProvider>
      ))}
      {canAdd && (
        <button type='button' onClick={add}>Add another</button>
      )}
    </FieldProvider>
  )
}

export default Multiple;

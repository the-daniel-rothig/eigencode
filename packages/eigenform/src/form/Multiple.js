import React, { useContext, useState } from 'react';
import { FieldProvider } from './Field';
import FieldContext from './FieldContext';
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

// TODO: do properly
const NEW_ITEM_VALUE = () => ({})

const MultipleInner = ({children, className, min=1, max, renderItem = SingleItem}) => {
  const {setValue, fieldValue} = useContext(FieldContext);
  
  const arr = Array.isArray(fieldValue) ? fieldValue : [];
  const [uids, setUids] = useState(arr.map(() => makeUid()));
  
  if (min && uids.length < min) {
    const newUids = [...uids, ...(new Array(min - uids.length))].map(() => makeUid());
    setUids(newUids);
    setValue(
      [...(new Array(min))].map((v, i) => arr[i] || NEW_ITEM_VALUE())
    )
  }

  const add = () => {
    setUids(oldUids => [...oldUids, makeUid()]);
    const arrx = fieldValue;
    setValue([...arrx, NEW_ITEM_VALUE()]);
  }

  const removeAt = idx => () => {
    setUids(oldUids => oldUids.filter((_, i) => i !== idx));
    const arrx = fieldValue;
    setValue([...arrx.filter((x, i) => i !== idx)]);
  }

  const RenderItem = renderItem;

  const canAdd = !max || uids.length < max;
  const canRemove = !min || uids.length > min;

  return (
    <>
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
    </>
  )
}

const Multiple = (props) => {
  return (
    <FieldProvider name={props.name}>
      <MultipleInner {...props} />
    </FieldProvider>
  )
}

export default Multiple;

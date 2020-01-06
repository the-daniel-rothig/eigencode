import React, { useContext, useState } from 'react';
import FieldProvider from './Field';
import FieldContext from './FieldContext';
import makeUid from '../util/makeUid';

export const $isMultiple = Symbol('eigenform/isMultiple');

const Multiple = ({addItem, arrayOfItems, children}) => (
  <>
    {arrayOfItems.map(x => x.render(
      <>
        {children}
        {x.remove && <button type="button" onClick={x.remove}>Remove</button>}
      </>
    ))}
    {addItem && <button type="button" onClick={addItem}>Add another</button>}
  </>
);

// TODO: do properly
const NEW_ITEM_VALUE = () => ({})

export const asMultiple = (Component) => {
  const MultipleInjector = ({min, max, name, ...props}) => {
    if (min === undefined) {
      min = 1;
    }
    const {setValue, fieldValue = []} = useContext(FieldContext);
    
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

    const canAdd = !max || uids.length < max;
    const canRemove = !min || uids.length > min;

    const arrayOfItems = uids.map((uid, idx) => ({
      remove: canRemove ? removeAt(idx) : null,
      key: uid,
      index: idx,
      value: fieldValue[idx],
      render: (contents) => <FieldProvider key={uid} name={`[${idx}]`}>{contents}</FieldProvider>
    }));

    const addItem = canAdd ? add : null;

    return <Component name={name} arrayOfItems={arrayOfItems} addItem={addItem} {...props} />
  }

  const Hoc = (props) => (
    <FieldProvider name={props.name}>
      <MultipleInjector {...props} />
    </FieldProvider>
  );

  Hoc.displayName = Component.displayName || Component.name;

  Hoc[$isMultiple] = true;

  return Hoc;
}

export default asMultiple(Multiple);

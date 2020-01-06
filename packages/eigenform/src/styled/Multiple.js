import React, { useState } from 'react'
import { asMultiple } from './../form/Multiple';
import Expanding from './Expanding';
import Button from './Button';

const SingleItem = ({children, remove}) => {
  const [removedClicked, setRemovedClicked] = useState(false);
  return (
    <Expanding className='multiple__item' bounce={!!remove} when={!removedClicked} onCollapsed={remove}>
      {children}
      <Expanding when={remove} bounce={false}>
        <Button onClick={(e) => {e.preventDefault(); setRemovedClicked(true);}}>Remove</Button>
      </Expanding>
    </Expanding>
  );
}

const Multiple = asMultiple(({addItem, arrayOfItems, children}) => {
  return (
    <div className='multiple'>
      {arrayOfItems.map(x => x.render(
        <SingleItem remove={x.remove}>{children}</SingleItem>
      ))}
      <Expanding when={!!addItem} bounce={false}> 
        <Button onClick={addItem}>Add another</Button>
      </Expanding>
    </div>
  )
});

export default Multiple
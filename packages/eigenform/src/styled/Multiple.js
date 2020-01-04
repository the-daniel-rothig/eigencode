import React, { useState } from 'react'
import BaseMultiple from './../form/Multiple';
import Expanding from './Expanding';
import Button from './Button';

const SingleItem = ({children, remove}) => {
  const [removedClicked, setRemovedClicked] = useState(false);
  return (
    <Expanding className='multiple__item' bounce={!!remove} when={!removedClicked} onCollapsed={remove}>
      {children}
      {remove && (
        <Button onClick={(e) => {e.preventDefault(); setRemovedClicked(true);}}>Remove</Button>
      )}
    </Expanding>
  );
}

const Multiple = (props) => {
  return (
    <div className='multiple'>
      <BaseMultiple 
        {...props}
        renderItem={SingleItem} />
    </div>
  )
}

export default Multiple
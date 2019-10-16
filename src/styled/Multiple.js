import React, {useLayoutEffect} from 'react'
import BaseMultiple from './../form/Multiple';
import Expanding from './Expanding';
import Button from './Button';

const SingleItem = ({children, remove}) => {
  return (
    <Expanding className='multiple__item' bounce={!!remove} render={({hide}) => (
      <>
        {children}
        {(remove) && (
          <Button onClick={(e) => {e.preventDefault(); hide(remove);}}>Remove</Button>
        )}
      </>
    )} />
  )
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
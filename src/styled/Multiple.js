import React, {useLayoutEffect} from 'react'
import BaseMultiple from './../form/Multiple';
import Expanding from './Expanding';
import Button from './Button';

const SingleItem = ({children, remove}) => {
  return (
    <Expanding bounce={!!remove} render={({hide}) => (
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
    <BaseMultiple 
      {...props}
      renderItem={SingleItem} />
  )
}

export default Multiple
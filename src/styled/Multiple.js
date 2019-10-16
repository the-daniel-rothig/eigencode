import React, {useLayoutEffect} from 'react'
import BaseMultiple from './../form/Multiple';
import Expanding from './Expanding';

const SingleItem = ({children, remove}) => {
  return (
    <Expanding bounce={!!remove} render={({hide}) => (
      <>
        {children}
        {(remove) && (
          <button onClick={(e) => {e.preventDefault(); hide(remove);}}>Remove</button>
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
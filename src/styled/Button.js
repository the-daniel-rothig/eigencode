import React from 'react';

const Button = ({children, onClick}) => {
  return (
    <button 
      className='button'
      onClick={e => {
        e.preventDefault();
        if (onClick) {
          onClick(e)
        }
      }}>{children}</button>
  )
}

export default Button;
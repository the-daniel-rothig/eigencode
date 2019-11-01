import React from 'react';
import styles from './Radio.module.css'
import RadioBase from '../form/Radio'

const Radio = ({value, children}) => {

  return (
    <RadioBase value={value} className={styles.radio}>
      <div className={styles.checkmark} />
      {children}
    </RadioBase>
  )
}

export default Radio
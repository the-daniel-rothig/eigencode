import React from 'react'
import styles from './YesNo.module.css';
import Radio from './Radio';

const YesNo = () => {
  return (
    <div className={styles.yesNoContainer}>
      <Radio value='yes'>Yes</Radio>
      <Radio value='no'>No</Radio>
    </div>
  )
}

export default YesNo
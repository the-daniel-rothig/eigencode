import React from 'react';
import styles from './Checkbox.module.css'
import CheckboxBase from '../form/Checkbox'

const Checkbox = ({value, children}) => {

  return (
    <CheckboxBase value={value} className={styles.checkbox}>
      <div className={styles.checkmark}>
        <svg className={styles.checkmarkSvg} xmlns="http://www.w3.org/2000/svg" viewBox="6 6 40 40">
          <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
      {children}
    </CheckboxBase>
  )
}

export default Checkbox
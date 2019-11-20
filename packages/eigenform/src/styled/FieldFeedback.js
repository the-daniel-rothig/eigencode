import React, { useState } from 'react';
import FieldFeedbackBase from '../form/FieldFeedback';
import Expanding from './Expanding';

const FieldFeedback = () => {
  const [error, setError] = useState();
  const [targetErr, setTargetErr] = useState('')


  return (
    <Expanding render={({hide, show}) => {
      return <FieldFeedbackBase render={err => {
        if (err !== targetErr) {
          setTargetErr(err);
        }
        if (!err && targetErr) {
          hide(() => setError(err))
        } else if (err && !targetErr) {
          show(() => setError(err))
        }

        return error || err ? <span className='field-feedback'>{error || err}</span> : null;
      }}/>
    }} />
  )
}

export default FieldFeedback;
import React from 'react';
import FieldFeedbackBase, { useFieldFeedback } from '../form/FieldFeedback';
import Expanding from './Expanding';

const FieldFeedback = () => {
  const errorMessage = useFieldFeedback();

  return (
    <Expanding when={!!errorMessage}>
      <FieldFeedbackBase>{errorMessage}</FieldFeedbackBase>
    </Expanding>
  );
}

export default FieldFeedback;
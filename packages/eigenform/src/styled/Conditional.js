import React from 'react';

import Expanding from './Expanding';
import { asConditional } from '../form/Conditional';
import { withResetFields } from '../form/withResetFields';

const Conditional = withResetFields(asConditional(({shouldShow, resetFields, flat, preserveValues, children}) => {
  return (
    <Expanding 
      when={shouldShow}
      onCollapsed={!preserveValues && resetFields}
      className={flat ? 'conditional--flat' : 'conditional'}
    >
      {children}
    </Expanding>
  );
}));

export default Conditional;
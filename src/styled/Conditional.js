import React from 'react';

import BaseConditional from '../form/Conditional';
import Expanding from './Expanding';

const Conditional = ({flat, ...props}) => {
  return (
    <Expanding 
      render={({show, hide}) => (
      <BaseConditional 
          onCollapsing={hide}
          onExpanding={show}
          className={flat ? 'conditional--flat' : 'conditional'}
          {...props} />
    )} />
  );
}

export default Conditional;

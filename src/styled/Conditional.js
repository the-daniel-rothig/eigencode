import React from 'react';

import BaseConditional from '../form/Conditional';
import Expanding from './Expanding';

const Conditional = ({flat, ...props}) => {
  return (
    <Expanding 
      className={flat ? 'conditional--flat' : 'conditional'}
      render={({show, hide}) => (
      <BaseConditional 
          onCollapsing={hide}
          onExpanding={show}
          {...props} />
    )} />
  );
}

export default Conditional;

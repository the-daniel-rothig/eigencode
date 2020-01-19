import React from 'react';
import { render } from '@testing-library/react';

const saneToArray = (children) => {
  const res = [];
  React.Children.map(children, c => res.push(c));
  return res;
}

it('preserves keys on toArray?', () => {
  const Probe = ({children}) => {
    const array1 = saneToArray(children);
    
    saneToArray(array1).map((c,i) => {
      expect(c.key).toBe(array1[i].key);
    });
    
    return null;
  }

  render(
    <Probe>
      <div>one</div>
      <div>two</div>
      <div>three</div>
    </Probe>
  )
})
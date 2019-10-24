import React from 'react'
import { render } from '@testing-library/react'

it('counts string', () => {
  expect(React.Children.map(null, c => {
    return c
  })).toBe(null)
})

it('allows to return children', () => {
  const Comp = ({children}) => [children, children];
  const element = <Comp>{null}{null}</Comp>;
  const unboxed = element.type(element.props);
  expect(React.Children.toArray(element.props.children)).toBe(8)

  const fn = jest.fn(c => c);
  const res = React.Children.map(element.props.children, fn);

  expect(fn).toHaveBeenCalledTimes(2);
})
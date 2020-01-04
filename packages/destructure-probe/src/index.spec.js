import probeDestructuredArguments from '.';

it('works', () => {
  let wasExecuted = false;

  const result = probeDestructuredArguments(({foo, bar}, {baz}) => () => {
    wasExecuted = true;
  });
  expect(result).toEqual([['foo', 'bar'], ['baz']]);
  expect(wasExecuted).toBe(false);
})
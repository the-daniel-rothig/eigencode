import { deepGet, deepSet } from "./objectTraversal"

it('is a simple test', () => {
  const obj = {
    foo: {
      bar: [
        {baz: 'success'}
      ]
    }
  }

  expect(deepGet(obj, "foo.bar[0].baz")).toBe('success')
})

it('preserves referenial integrity', () => {
  const obj = {
    array: []
  };

  const theArray = obj.array;

  expect(deepGet(obj, "array")).toBe(theArray);
  
  deepSet(obj, 'array[0]', {});
  expect(deepGet(obj, "array")).toBe(theArray);
})
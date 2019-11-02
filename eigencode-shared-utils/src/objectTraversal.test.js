import { deepGet } from "./objectTraversal"

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
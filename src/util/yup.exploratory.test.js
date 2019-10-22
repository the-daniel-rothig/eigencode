import * as yup from 'yup';

it('prioritises RHS in concat', () => {
  //const schema = yup.string().notRequired().concat(yup.string().required())
  const schema = yup.string().required().concat(yup.string().notRequired())
  expect(schema.isValidSync("")).toBe(true);
})

it('lets you concat mixed with specific schema', () => {
  const schema = yup.mixed().concat(yup.number());
  expect(schema.isValidSync("foo")).toBe(false)
  expect(schema.isValidSync(42)).toBe(true)
})

it('lets you combine allowed values', () => {
  const firstSchema = yup.mixed().oneOf(['one']) 
  const secondSchema = yup.mixed().oneOf(['two']) 
  const schema = firstSchema.concat(secondSchema);

  expect(schema.isValidSync('one')).toBe(true)
  expect(schema.isValidSync('two')).toBe(true)
  expect(schema.isValidSync('three')).toBe(false)
})
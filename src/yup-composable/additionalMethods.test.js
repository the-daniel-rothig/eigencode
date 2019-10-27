import { string } from 'yup';
import './additionalMethods';
import setDefaultLocale from './setDefaultLocale';

describe('doesNotContain', () => {
  it('works with a string', () => {
    const schema = string().mustNotContain('boom', "${path} must not contain '${mustNotContain}'")
    return expect(schema.validate('hello boom bye')).rejects.toThrow("this must not contain 'boom'")
  })
  it('works with a regex', () => {
    const schema = string().mustNotContain(/[0-9]/, "${path} must not contain a number")
    return expect(schema.validate('hello 123 bye')).rejects.toThrow("this must not contain a number")
  })
  
  it('returns the first match of the regex', () => {
    const schema = string().mustNotContain(/[0-9]/, "${path} contains invalid character: '${match}'")
    return expect(schema.validate('hello 123 bye')).rejects.toThrow("this contains invalid character: '1'")
  })

  it('respects default locale', () => {
    setDefaultLocale();
    const schema = string().mustNotContain(/[0-9]/)
    return expect(schema.validate('hello 123 bye')).rejects.toThrow("this must not contain '1'")
  })
})
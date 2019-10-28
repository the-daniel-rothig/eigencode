import { string, mixed } from 'yup';
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

describe('requiredStrict', () => {
  const requiredStrictIsValid = val => mixed().requiredStrict().isValidSync(val)

  it('allows "true"', () => expect(requiredStrictIsValid(true)).toBe(true))
  it('allows "false"', () => expect(requiredStrictIsValid(false)).toBe(true))
  it('allows "0"', () => expect(requiredStrictIsValid(0)).toBe(true))
  it('allows "{}"', () => expect(requiredStrictIsValid({})).toBe(true))
  it('allows "[]"', () => expect(requiredStrictIsValid([])).toBe(true))

  it('fails empty string', () => expect(requiredStrictIsValid('')).toBe(false))
  it('fails whitespace string', () => expect(requiredStrictIsValid(' \t')).toBe(false))
  it('fails newline', () => expect(requiredStrictIsValid('\n')).toBe(false))
  it('fails null', () => expect(requiredStrictIsValid(null)).toBe(false))
  it('fails undefined', () => expect(requiredStrictIsValid(undefined)).toBe(false))

  it('ignores nullable', () => {
    expect(mixed().nullable().requiredStrict().isValidSync(null)).toBe(false)
    expect(mixed().requiredStrict().nullable().isValidSync(null)).toBe(false)
  })

  it('works with derived schemas', () => {
    expect(string().requiredStrict().isValidSync('   ')).toBe(false)
  })

  it('uses message if present', () => {
    expect(() => mixed().requiredStrict('foo').validateSync('  ')).toThrow('foo')
  })

  it('falls back to required message', () => {
    expect(() => mixed().requiredStrict().validateSync('   ')).toThrow('please enter undefined');
  })
})

it('exploratory: required', () => {
  expect(mixed().required().isValidSync([])).toBe(true)
})
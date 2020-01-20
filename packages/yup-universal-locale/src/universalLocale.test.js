import { string, mixed, object, addMethod, setLocale } from 'yup';
import './universalLocale';

addMethod(string, 'mustNotContain', function(stringToExclude, message) {
  return this.test({
    name: 'mustNotContain',
    test: (value) => value.indexOf(stringToExclude) === -1,
    message: message,
    params: {
      mustNotContain: stringToExclude
    }
  })
})

addMethod(mixed, 'notEmpty', function(message) {
  return this.test({
    name: 'notEmpty',
    test: (value) => (typeof value !== "object" || !!Object.keys(value).length) && value !== "",
    message: message
  })
})

it('picks up locales for custom tests, injects parameters', () => {
  setLocale({
    string: {
      mustNotContain: "${path} can't contain '${mustNotContain}'"
    }
  });

  const validator = string().mustNotContain("foo");

  expect(() => validator.validateSync("foo")).toThrow("this can't contain 'foo'");
})

it('prioritises messages of the current schema but falls back to `mixed`', () => {
  setLocale({
    mixed: {
      notEmpty: 'fallbackMessage'
    },
    string: {
      notEmpty: 'stringSpecificMessage'
    }
  });

  expect(() => string().notEmpty().validateSync("")).toThrow('stringSpecificMessage');
  expect(() => object().notEmpty().validateSync({})).toThrow('fallbackMessage');
})
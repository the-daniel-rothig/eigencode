import { string, mixed, addMethod } from 'yup'
import { localeValues } from './setDefaultLocale';

addMethod(string, 'mustNotContain', function(stringOrRegex, message) {
  const getMatch = stringOrRegex instanceof RegExp ? v => stringOrRegex.exec(v)
    : typeof stringOrRegex === "string" ? v => v.indexOf(stringOrRegex) === -1 ? null : [stringOrRegex]
    : v => v.indexOf(stringOrRegex.toString()) === -1 ? null : [stringOrRegex.toString()]

  const params = {
    mustNotContain: stringOrRegex.toString()
  }
  
  return this.test({
    name: 'mustNotContain',
    params,
    message: message || localeValues.string.mustNotContain,
    test: function(value) {
      const match = getMatch(value)
      return match ? this.createError({ params: { match: match[0] } }) : true;
    }
  })
})

const notJustWhitespaceTestRegex = /[^\s]+/m;

addMethod(mixed, 'requiredStrict', function(message) {
  return this.test({
    name: 'requiredStrict',
    message: message || localeValues.mixed.requiredStrict || localeValues.mixed.required,
    exclusive: true,
    test: function(value) {
      return value !== null && value !== undefined && (Array.isArray(value) || notJustWhitespaceTestRegex.test(`${value}`))
    }
  });
});
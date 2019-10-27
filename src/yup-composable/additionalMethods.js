import { string, addMethod } from 'yup'
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
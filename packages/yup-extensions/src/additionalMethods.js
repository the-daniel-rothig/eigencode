/* eslint-disable no-template-curly-in-string */
import { string, mixed, addMethod, setLocale } from 'yup'
import 'yup-universal-locale';
// hack!
import { deepGet } from '../../eigencode-shared-utils/src/objectTraversal';

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
    message: message,
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
    message: message,
    exclusive: true,
    test: function(value) {
      return value !== null && value !== undefined && (Array.isArray(value) || notJustWhitespaceTestRegex.test(`${value}`))
    }
  });
});


const lastNumberIndexRegex = /\[([0-9]+)\](?!.*\[[0-9]+\])/;

addMethod(mixed, 'unique', function(selector, message) {
  const saneSelector = selector || (x => x);
  return this.test({
    name: 'unique',
    message: message,
    test: function(value) {
      const match = this.path.match(lastNumberIndexRegex);
      if (!match) {
        // if this is not in an array at all, it's unique by definition
        return true;
      }

      const array = deepGet(this.options.context, this.path.substring(0, match.index));

      if (!Array.isArray(array)) {
        throw new Error(
              "yup error: unique() validation requires value to be supplied as the context.\n" +
              "   you can do so by calling e.g. schema.validate(value, {context: value})\n" +
              "   instead of schema.validate(value)");
      }

      const thisIndex = parseInt(match[1])
      const pathInArray = this.path.substring(match.index + match[0].length);

      for(var i = 0; i < thisIndex; i++) {
        if (saneSelector(value) === saneSelector(deepGet(array[i], pathInArray))) {
          return false;
        }
      }
      return true;
    }
  })
})

setLocale({
  mixed: {
    unique: 'you cannot use the same answer for ${path} twice',
    requiredStrict: "please enter ${path}"
  },
  string: {
    mustNotContain: "${path} must not contain '${match}'"
  }
})
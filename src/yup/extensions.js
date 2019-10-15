import { string , addMethod } from 'yup';

addMethod(string, 'numeric', function(message) {
  return this.test({
    name: 'string-numeric',
    test: (value) => /^[0-9]+$/.test(value),
    message: message || 'Use numerals only'
  })
})

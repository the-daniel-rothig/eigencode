# yup-universal-locale

Build perfectly integrated extensions to [yup](https://github.com/jquense/yup) by registering custom validation methods to the locale.

## Improved localisation

Yup offers a `setLocale` method, allowing users to set custom default messages for validations. Unfortunately this only works for the built-in validations that `yup` ships with - custom tests cannot access this locale, which means that if you supply new validations, users of your extension can not set a default message for them.

**yup-universal-locale** adds this functionality. Users of your validations don't have to do anything special or import anything - it's sufficient for your to import `yup-universal-locale` in your extension.

```javascript
import { string, addMethod, setLocale } from 'yup';
import 'yup-universal-locale';

// create a custom validation
addMethod(string, 'mustNotContain', function(stringToExlude, message) {
  return this.test({
    // the name is crucial: it determines the lookup in the locale
    name: 'mustNotContain', 
    message: message,
    test: val => val.indexOf(stringToExlude) === -1),
    params: {
      mustNotContain: stringToExclude
    }
  })
})
```

Clients can then use your code as follows:

```javascript
import { setLocale, string } from 'yup';
import 'your-yup-extension-library';

// set custom default messages - both for built-in validations and your own
setLocale({
  mixed: {
    required: "please enter ${path}",
    mustNotContain: "your answer must not contain '${mustNotContain}"
  }
});

// now you can use the default message from the locale...
string()
  .mustNotContain("foo")
  .validate("foobar") 
// ==> "your answer must not contain 'foo'"

// ...or supply your own as usual:
string()
  .mustNotContain("foo", "don't say foo")
  .validate("foobar") 
// ==> "don't say foo"
```

<details>
  <summary>Reminder: Validation messages can also be functions</summary>
  
  For fully dynamic control over the message, instead of setting it to a string, you can set it to a function that returns a string. `yup` will pass in an options object with the following entries:

  - path,
  - value,
  - originalValue (before casts and transformations),
  - label
  - *for custom tests*, any values passed into the `params` option when the test was defined
  - some *built-in tests* have additional parameters as well, check the [yup documentation](https://github.com/jquense/yup)

  (This is just part of the core yup library.)
</details>

`yup` will look up a matching message in the following order of preference:

1. The message supplied directly to the test method
2. The message matching the schema type and the test name in the locale
3. The message matching the `mixed` schema in the locale
4. The message set in the locale for `mixed.default`

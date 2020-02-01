# yup-extensions (WIP)

Some additional validation methods for [yup](https://github.com/jquense/yup)

```bash
npm install yup-extensions
```

Part of the [eigencode](../..) project.

## Example

```javascript
import { array, object, string } from 'yup';
import 'yup-extensions';

const val1 = string().mustNotContain("password");
const val2 = string().requiredStrict();
const val3 = array().of(object({
  firstName: string().unique()
  lastName: string()
}));
```

**yup-extensions** makes use of [yup-universal-locale](../yup-universal-locale), so you can set default messages for these methods using yup's `setLocale` method.

```javascript
import { setLocale } from 'yup';

setLocale({
  string: {
    mustNotContain: "${path} must not cotain '${mustNotContain}",
    // etc.
  }
});
```

## Included validation methods

**string.mustNotContain(stringOrRegex, message?)** - fails if the value contains the specified string, or matches the specified regex. The message is passed a `match` parameter which is the matching string.

**mixed.requriedStrict(message?)** - fails if the value is missing, or `null`, or an empty string, or a string containing only whitespace.

**mixed.unique(selector?, message?)** - only valid within an array, this ensures that this value does not appear in the same place in other entries of the array. This is determined by strict equality (`a === b`) - a `selector` function may be used to map the value to the value-to-be-compared. **Important**: for this validator to work, the validation context must be set to the data object to be validated:

```javascript
const val = array().of(object({
  firstName: string().unique()
  lastName: string()
}));

val.validate(data, {context: data})
```
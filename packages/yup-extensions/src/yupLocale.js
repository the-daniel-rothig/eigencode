/* eslint-disable no-template-curly-in-string */
import { setLocale as yupSetLocale } from 'yup'

const defaultLocaleValues = {
  mixed: {
    default: 'please correct ${label}',
    required: 'please enter ${label}',
    unique: 'you cannot use the same answer for ${label} twice'
  },
  string: {
    max: ({label, max}) => max === 1 ? `${label} must be no more than ${max} character` : `${label} must be no more than ${max} characters`,
    min: ({label, min}) => min === 1 ? `${label} must be at least ${min} character` : `${label} must be at least ${min} characters`,
    email: "please enter a valid email address",
    mustNotContain: "${path} must not contain '${match}'"
  }
}

let localeValues;

export const setLocale = (values = defaultLocaleValues) => {
  localeValues = values;
  yupSetLocale(values);
}

setLocale(defaultLocaleValues);

export const getLocale = (schemaName, methodName) => {
  if (localeValues[schemaName] && localeValues[schemaName][methodName]) {
    return localeValues[schemaName][methodName];
  } else if (localeValues.mixed && localeValues.mixed[methodName]) {
    return localeValues.mixed[methodName];
  } else {
    return null;
  }
}

import { setLocale } from 'yup'

export const localeValues = {
  mixed: {
    default: 'please correct ${label}',
    required: 'please enter ${label}',
  },
  string: {
    max: ({label, max}) => max === 1 ? `${label} must be no more than ${max} character` : `${label} must be no more than ${max} characters`,
    min: ({label, min}) => min === 1 ? `${label} must be at least ${max} character` : `${label} must be at least ${max} characters`,
    email: "please enter a valid email address",
    mustNotContain: "${path} must not contain '${match}'"
  }
}

export default () => setLocale(localeValues)
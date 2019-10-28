import * as yup from 'yup'

const fragmentNames = [
  'label',
  'meta',
  'concat',
  'strict',
  'strip',
  'default',
  'nullable',
  'required',
  'notRequired', 
  'optional',
  'typeError',
  'oneOf', 
  'equals', 
  'is',
  'notOneOf', 
  'not', 
  'nope',
  'when',
  'test',
  'transform',
  'length',
  'min',
  'max',
  'matches',
  'email',
  'url',
  'ensure',
  'trim',
  'lowercase',
  'uppercase',
  'lessThan',
  'moreThan',
  'positive',
  'negative',
  'integer',
  'truncate',
  'round',
  'of',
  'compact',
  'shape',
  'from',
  'unknown',
  'noUnknown',
  'transformKeys',
  'camelCase',
  'constantCase',
  'snakeCase',
];

const assignExtensionMethods = obj => fragmentNames.forEach(name => {
  obj[name] = (...args) => new YupFragment(name, args, obj.f);
}) 

export default class YupFragment {
  constructor(name, args = [], prior) {
    if (name && prior) {
      this.f = schema => prior(schema)[name](...args)
    } else if (name) {
      this.f = schema => schema[name](...args)
    } else if (prior) {
      this.f = prior
    }
    this.__isYupFragment__ = true;
    assignExtensionMethods(this);
  }

  applyToSchema = schema => this.f 
    ? this.f(schema || yup.mixed()) 
    : schema || yup.mixed()
}

const yupFragment = new YupFragment()

// convenience exports
export const defaultValue = yupFragment.default;

export const label = yupFragment.label;
export const meta = yupFragment.meta;
export const concat = yupFragment.concat;
export const strict = yupFragment.strict;
export const strip = yupFragment.strip;
export const nullable = yupFragment.nullable;
export const required = yupFragment.required;
export const notRequired = yupFragment.notRequired; 
export const optional = yupFragment.optional;
export const typeError = yupFragment.typeError;
export const oneOf = yupFragment.oneOf; 
export const equals = yupFragment.equals; 
export const is = yupFragment.is;
export const notOneOf = yupFragment.notOneOf; 
export const not = yupFragment.not; 
export const nope = yupFragment.nope;
export const when = yupFragment.when;
export const test = yupFragment.test;
export const transform = yupFragment.transform;
export const length = yupFragment.length;
export const min = yupFragment.min;
export const max = yupFragment.max;
export const matches = yupFragment.matches;
export const email = yupFragment.email;
export const url = yupFragment.url;
export const ensure = yupFragment.ensure;
export const trim = yupFragment.trim;
export const lowercase = yupFragment.lowercase;
export const uppercase = yupFragment.uppercase;
export const lessThan = yupFragment.lessThan;
export const moreThan = yupFragment.moreThan;
export const positive = yupFragment.positive;
export const negative = yupFragment.negative;
export const integer = yupFragment.integer;
export const truncate = yupFragment.truncate;
export const round = yupFragment.round;
export const of = yupFragment.of;
export const compact = yupFragment.compact;
export const shape = yupFragment.shape;
export const from = yupFragment.from;
export const unknown = yupFragment.unknown;
export const noUnknown = yupFragment.noUnknown;
export const transformKeys = yupFragment.transformKeys;
export const camelCase = yupFragment.camelCase;
export const constantCase = yupFragment.constantCase;
export const snakeCase = yupFragment.snakeCase;

const isFragment = fragment => fragment && fragment.__isYupFragment__;

/*
A       B       rtn
Frag    Frag    Frag    // ok
Schema  Schema  Schema  // concat (may error because of yup's schema type limitations)
Schema  Frag    Schema  // toYupSchema and concat (may error because of yup's schema type limitations)
Frag    Schema  Schema  // apply Frag to Schema (B's base wins out anyway)
*/
export const mergeYupFragments = (arrayOfFragments) => {
  const fragments = arrayOfFragments.filter(Boolean).filter(x => yup.isSchema(x) || isFragment(x));
  if (fragments.length === 0) {
    return null;
  }
  if (fragments.length === 1) {
    return fragments[0];
  }
  return fragments.slice(1).reduce((a,b) => { 
    if (isFragment(a) && isFragment(b)) {
      return new YupFragment(null, null, b.f && a.f ? schema => b.f(a.f(schema)) : a.f || b.f)
    } else if (isFragment(a)) {
      return a.f ? a.f(b) : b;
    } else if (isFragment(b)) {
      return b.f ? b.f(a) : a;
    } else {
      return a.concat(b);
    }
  }, fragments[0]);
};

export const toSchema = schemaOrFragmentOrNull => 
  yup.isSchema(schemaOrFragmentOrNull) ? schemaOrFragmentOrNull :
  schemaOrFragmentOrNull && schemaOrFragmentOrNull.__isYupFragment__ ? schemaOrFragmentOrNull.applyToSchema() :
  schemaOrFragmentOrNull;
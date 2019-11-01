import * as yup from 'yup'

const getF = (name, args = [], prior) => {
  if (!name && !prior) {
    return null;
  }
  if (name && prior) {
    return x => {
      const p = prior(x);
      return typeof p[name] === "function" ? p[name](...args) : p;
    }
  }
  if (name) {
    return x => typeof x[name] === "function" ? x[name](...args) : x; 
  }
  return prior;
}

const mergeF = (f1, f2) => {
  return f1 && f2 && (x => f2(f1(x))) || f2 || f1 || null;
}

const mapToSchemas = obj => {
  if (typeof obj !== "object") return obj;

  if (typeof obj.toYupSchema === "function") {
    return obj.toYupSchema()
  }

  Object.keys(obj).forEach(key => {
    if (typeof obj[key].toYupSchema === "function") {
      obj[key] = obj[key].toYupSchema()
    }
  });

  return obj;
}

class YupFragment {
  constructor(name, args, base, prior) {
    this.f = getF(name, args, prior);
    this.base = base;
    this.__isYupSchema__ = true;
  }

  when  = (keys, builder) => typeof builder === "function"
    ? proxied(new YupFragment('when', [keys, (...args) => mapToSchemas(builder(...args))], this.base, this.f))
    : proxied(new YupFragment('when', [keys, mapToSchemas(builder)], this.base, this.f))
    
  withMutation = () => { throw "withMutation is not supported by YupFragment. Cast to Schema first by calling .toYupSchema()"; }

  object = (...args)      => proxied(new YupFragment(args[0] && 'shape', args, yup.object, this.f))
  array  = (...args)      => proxied(new YupFragment(args[0] && 'of', args, yup.array,  this.f))

  shape  = (obj, ...rest)      => proxied(new YupFragment('shape', [mapToSchemas(obj), ...rest], this.base, this.f))
  of     = (obj, ...rest)      => proxied(new YupFragment('of', [mapToSchemas(obj), ...rest], this.base, this.f))

  toYupSchema = () => 
    this.asYupSchema || // memoised as a convenience
    (this.asYupSchema = this.f 
        ? this.f(this.base ? this.base() : yup.mixed()) 
        : this.base ? this.base() : yup.mixed())
}

const referenceMixedInstance = yup.mixed();

const proxiedFunction = (name, thisRef) => new Proxy(() => {}, {
  apply: (_obj, _thisArg, args) => {
    if (typeof referenceMixedInstance[name] === "function" && !yup.isSchema(referenceMixedInstance[name](...args))) {
      return thisRef.toYupSchema()[name](...args);
    }
    return proxied(new YupFragment(name, args, thisRef.base, thisRef.f))
  }
})

const proxied = yupFragment => new Proxy(yupFragment, {
  get: (obj, prop) => {
    if (prop in obj) {
      return obj[prop];
    } 
    if (yup[prop] && yup.isSchema(yup[prop].prototype)) {
      return (...args) => proxied(new YupFragment(null, null, () => yup[prop](...args), obj.f))
    }
    return proxiedFunction(prop, obj);
  }
})

export const yupFragment = proxied(new YupFragment())

// convenience exports
export const label = yupFragment.label;
export const meta = yupFragment.meta;
export const concat = yupFragment.concat;
export const strict = yupFragment.strict;
export const strip = yupFragment.strip;
export const defaultValue = yupFragment.default;
export const nullable = yupFragment.nullable;
export const required = yupFragment.required;
export const notRequired = yupFragment.notRequired;
export const typeError = yupFragment.typeError;
export const oneOf = yupFragment.oneOf;
export const notOneOf = yupFragment.notOneOf;
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
export const noUnknown = yupFragment.noUnknown;
export const camelCase = yupFragment.camelCase;
export const constantCase = yupFragment.constantCase;

export const string = yupFragment.string;
export const number = yupFragment.number;
export const date = yupFragment.date;
export const bool = yupFragment.bool;
export const boolean = yupFragment.boolean;
export const object = yupFragment.object;
export const array = yupFragment.array;

export const clone = yupFragment.clone;
export const describe = yupFragment.describe;
export const validate = yupFragment.validate;
export const validateAt = yupFragment.validateAt;
export const validateSync = yupFragment.validateSync;
export const validateSyncAt = yupFragment.validateSyncAt;
export const isValid = yupFragment.isValid;
export const isValidSync = yupFragment.isValidSync;
export const cast = yupFragment.cast;
export const isType = yupFragment.isType;

/*
A       B       rtn
Frag    Frag    Frag    // ok
Schema  Schema  Schema  // concat (may error because of yup's schema type limitations)
Schema  Frag    Schema  // apply B on A
Frag    Schema  Schema  // apply A on B, then reapply B to undo any overrides
*/
export const mergeYupFragments = (...args) => {
  const fragments = args.filter(Boolean).filter(x => yup.isSchema(x));
  return fragments.reduce((a,b) => { 
    if (a instanceof YupFragment && b instanceof YupFragment) {
      return new YupFragment(
        null,
        null,
        b.base || a.base,
        mergeF(a.f, b.f));
    }
    if (b instanceof YupFragment) {
      return typeof b.f === "function" ? b.f(a) : a 
    }
    if (a instanceof YupFragment) {
      return typeof a.f === "function"
        ? a.f(b).concat(b)
        : b;
    }
    return a.concat(b); 
  }, new YupFragment());
};
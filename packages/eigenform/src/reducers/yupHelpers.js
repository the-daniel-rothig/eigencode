import * as yup from 'yup';

export const mergeYupFragments = (arrayOfFragments) => {
  const fragments = arrayOfFragments
    .filter(Boolean)
    .filter(x => yup.isSchema(x) || typeof x === "function");

  if (fragments.length === 0) {
    return undefined;
  }
  if (fragments.length === 1) {
    return fragments[0];
  }
  return fragments.slice(1).reduce((a,b) => { 
    if (typeof a === "function" && typeof b === "function") {
      return s => b(a(s))
    } else if (typeof a === "function") {
      //todo: test effect of re-concat
      return a(b).concat(b);
    } else if (typeof b === "function") {
      return b(a);
    } else {
      return a.concat(b);
    }
  }, fragments[0]);
};

export const toSchema = (fragment) => {
  if (yup.isSchema(fragment)) {
    return fragment;
  }
  if (typeof fragment === "function") {
    return fragment(yup.mixed());
  }
  if (fragment === undefined) {
    return yup.mixed()
  }
  throw new Error('toSchema called with an argument that is neither a yup schema nor a function');
}
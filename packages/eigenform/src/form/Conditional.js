import React from 'react';

import GroupContext from './GroupContext';
import FormContext from './FormContext';
import { usePrevious } from 'eigencode-shared-utils';
import { withFilteredContext } from 'react-context-filter';
import { withResetFields } from './withResetFields';
import { getFullName } from './Group';

export const isConditionalShowing = (when = '', is, includes, groupContext, getValue)  => {
  is = getSaneIs(is, includes, when);
  const saneWhen = Array.isArray(when) ? when : [when]
    
  const saneIs = 
      typeof is === 'function' ? is 
    : Array.isArray(is)        ? (...vals) => is.filter((expected, i) => expected !== vals[i]).length > 0
    :                            (...vals) => vals[0] === is;

  const vals = saneWhen.map(x => getValue(x.startsWith("$") ? x.substring(1) : getFullName(groupContext, x)));

  const shouldShow = saneIs(...vals);

  return shouldShow;
}

const safelyTry = (callback, fallback) => {
  try {
    return callback()
  } catch {
    return fallback;
  }
}

export const getSaneIs = (is, includes, when) => {
  if (is !== undefined && includes !== undefined) {
    throw new Error('Conditional can be called with an "is" or an "includes" property, but not both');
  }
  if (includes !== undefined && Array.isArray(when)) {
    throw new Error('The "when" property does not accept an array when the "includes" property is set: only one value may be checked')
  }
  if (includes !== undefined) {
    return typeof includes === "function"
      ? x => (Array.isArray(x) ? x : []).findIndex(x => safelyTry(() => includes(x), false)) > -1
      : x => (Array.isArray(x) ? x : []).indexOf(includes) > -1;
  }
  return is;
}

export const $isConditional = Symbol('eigenform/isConditional');

export const asConditional = (Component) => {
  const Hoc = withFilteredContext(({when, is, includes}) => ({
    of: [GroupContext, FormContext],
    map: (groupContext, formContext) => {
      const saneWhen = Array.isArray(when) ? when : when ? [when] : [""];
      
      const whenValues = Object.assign({}, ...saneWhen.map(x => {
        const key = x.startsWith("$") ? x.substring(1) : getFullName(groupContext, x);
        return  {[key]: formContext ? formContext.getValue(key) : undefined}
      }));
      
      const shouldShow = isConditionalShowing(when, is, includes, groupContext, key => whenValues[key])
      return { shouldShow };
    },
    isUnchanged: (before, after) => before.shouldShow === after.shouldShow
  }))(Component);

  Hoc[$isConditional] = true;

  return Hoc;
}

const Conditional = ({shouldShow, resetFields, preserveValues, children}) => {
  const previousShouldShow = usePrevious(shouldShow);
  if (!shouldShow && previousShouldShow && !preserveValues) {
    resetFields();
  }
  return shouldShow ? <>{children}</> : null;
}

export default withResetFields(asConditional(Conditional));
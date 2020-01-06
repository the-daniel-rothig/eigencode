import React from 'react';
import { withFilteredContext } from 'context-filter';

import FieldContext from './FieldContext';
import FormContext from './FormContext';
import { sanitiseOuterName, getSaneName, $isField } from './Field';
import { $isMultiple } from './Multiple';
import { ReducerFunction, traverseDepthFirst } from 'react-traversal';
import { combineObjectPaths } from 'eigencode-shared-utils';
import isEqual from 'lodash/isEqual';
import flatten from 'lodash/flattenDeep';

const determineName = ({element, getContext}) => {
  // we can just capture the top level field names here - removing them
  // will implicitly remove their descendants. no need to unbox.
  const outer = getContext(FieldContext);
  const name = combineObjectPaths(
    sanitiseOuterName(outer && outer.name, element.props.embedded),
    getSaneName(element.props.name, element.props.label)
  );
  return [name];
}

export const getFieldNames = new ReducerFunction({
  reduce: ({unbox}) => unbox(),
  shouldUpdate: (a,b) => !isEqual(a,b),
  // todo: Reducer needs to implement unbox correctly to use resultset.
  finalTransform: x => flatten(x).filter(Boolean)
});

getFieldNames.addReducerRule($isField, determineName);

getFieldNames.addReducerRule($isMultiple, determineName);

export const withResetFields = (Component) => {
  return withFilteredContext({
    of: [FormContext, FieldContext],
    isUnchanged: (prev, next) => prev.resetFieldsContext.name === next.resetFieldsContext.name,
    map: (form, field) => ({
      resetFieldsContext: {
        name: field && field.name,
        deleteValue: form.deleteValue
      }
    })
  })(({resetFieldsContext, ...props}) => {
    const fields = traverseDepthFirst(<>{props.children}</>, getFieldNames);
    const resetFields = () => {
      fields.forEach(name => {
        resetFieldsContext.deleteValue(name)
      });
    }
    return <Component resetFields={resetFields} {...props} />
  });
}
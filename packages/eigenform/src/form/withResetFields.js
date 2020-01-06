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

const makeGetFieldNames = outerName => new ReducerFunction({
  reduce: ({unbox, element, isLeaf}) => {
    if(isLeaf) return unbox();
    if (element.type && (element.type[$isField] ||element.type[$isMultiple])) {
      // we can just capture the top level field names here - removing them
      // will implicitly remove their descendants. no need to unbox.
      const name = combineObjectPaths(
        sanitiseOuterName(outerName, element.props.embedded),
        getSaneName(element.props.name, element.props.label)
      );
      return [name];
    }
    return unbox();
  },
  shouldUpdate: (a,b) => !isEqual(a,b),
  // todo: Reducer needs to implement unbox correctly to use resultset.
  finalTransform: x => flatten(x).filter(Boolean)
});

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
    const getFieldNames = makeGetFieldNames(resetFieldsContext.name);
    const fields = traverseDepthFirst(<>{props.children}</>, getFieldNames);
    const resetFields = () => {
      fields.forEach(name => {
        resetFieldsContext.deleteValue(name)
      });
    }
    return <Component resetFields={resetFields} {...props} />
  });
}
import React from 'react';
import { withFilteredContext } from 'react-context-filter';

import GroupContext from './GroupContext';
import FormContext from './FormContext';
import { getSaneName, $isField } from './Field';
import { $isMultiple } from './Multiple';
import { CustomRenderFunction } from 'react-custom-renderer';
import { combineObjectPaths } from 'eigencode-shared-utils';
import isEqual from 'lodash/isEqual';
import flatten from 'lodash/flattenDeep';

const determineName = ({element, getContext}) => {
  // we can just capture the top level field names here - removing them
  // will implicitly remove their descendants. no need to unbox.
  const outer = getContext(GroupContext);
  const name = combineObjectPaths(
    outer && outer.name,
    getSaneName(element.props.name, element.props.label)
  );
  return [name];
}

export const getFieldNames = new CustomRenderFunction({
  reduce: ({unbox}) => unbox(),
  shouldUpdate: (a,b) => !isEqual(a,b),
  // todo: Reducer needs to implement unbox correctly to use resultset.
  finalTransform: x => flatten(x).filter(Boolean)
});

getFieldNames.addReducerRule($isField, determineName);
getFieldNames.addReducerRule($isMultiple, determineName);

export const withResetFields = (Component) => {
  return withFilteredContext({
    of: [FormContext, GroupContext],
    isUnchanged: (prev, next) => prev.resetFieldsContext.name === next.resetFieldsContext.name,
    map: (form, group) => ({
      resetFieldsContext: {
        name: group && group.name,
        deleteValue: form ? form.deleteValue : () => {}
      }
    })
  })(({resetFieldsContext, ...props}) => {
    const fields = getFieldNames.render(<>{props.children}</>);
    const resetFields = () => {
      fields.forEach(name => {
        resetFieldsContext.deleteValue(name)
      });
    }
    return <Component resetFields={resetFields} {...props} />
  });
}
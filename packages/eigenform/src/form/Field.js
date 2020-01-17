import React from 'react'
import { combineObjectPaths } from 'eigencode-shared-utils';
import FieldContext from './FieldContext'
import { withFilteredContext } from 'react-context-filter';
import FormContext from './FormContext';

export const sanitiseOuterName = (outerName, embedded) => {
  if (!outerName && embedded) {
    throw new Error("Fields marked embedded must be nested within another Field");
  }
  if (outerName && embedded) {
    const saneOuterName = outerName || '';
    const endIdx = Math.max(0, saneOuterName.lastIndexOf("."));
    return saneOuterName.substring(0, endIdx);
  }
  return outerName || '';
}

export const getSaneName = (name, label) => {
  if (name !== undefined) {
    return name;
  }
  return (label || '').replace(/\s+(.)/g, match => match[1].toUpperCase()).replace(/[^a-z0-9]/gi, "");
}

export const $isField = Symbol('eigenform/isField');

export const asField = Component => {
  const Hoc = withFilteredContext(({name, label, embedded}) => ({
    of: [FormContext, FieldContext],
    to: FieldContext,
    map: (formContext, outer) => {
      const saneName = getSaneName(name, label);
      const fullyQualifiedName = combineObjectPaths(sanitiseOuterName(outer && outer.name, embedded), saneName);
      
      return {
        name: fullyQualifiedName,
        uid: formContext ? formContext.uid : 'form',
        fieldValue: formContext ? formContext.getValue(fullyQualifiedName) : undefined,
        setValue: formContext ? v => formContext.setValue(fullyQualifiedName, v) : () => {},
        deleteValue: formContext ? () => formContext.deleteValue(fullyQualifiedName) : () => {},
      };
    },
    isUnchanged: (before, after) => {
      return before.name === after.name && before.uid === after.uid && before.fieldValue === after.fieldValue;
    }
  }))(Component)

  Hoc[$isField] = true;

  return Hoc;
};

const FieldTag = ({className, tag, children}) => {
  const Tag = !!tag ? tag 
    : className ? 'div' : React.Fragment;
    
  const props = Tag !== React.Fragment ? {className} : {}

  return (
      <Tag {...props}>{children}</Tag>
  );
}

export default asField(FieldTag);

import React, { useContext } from 'react'
import { combineObjectPaths } from 'eigencode-shared-utils';
import FieldContext from './FieldContext'
import makeCamelCaseFieldName from '../util/makeCamelCaseFieldName';
import ContextFilter from 'context-filter';
import FormContext from './FormContext';
import isEqual from 'lodash/isEqual';

export const FieldProvider = ({name= "", children}) => {
  const outer = useContext(FieldContext);
  const fullyQualifiedName = combineObjectPaths(outer && outer.name, name);
  const map = formContext => ({
    name: fullyQualifiedName,
    uid: formContext ? formContext.uid : 'form',
    fieldValue: formContext ? formContext.getValue(fullyQualifiedName) : undefined,
    setValue: formContext ? v => formContext.setValue(fullyQualifiedName, v) : () => {},
    deleteValue: formContext ? () => formContext.deleteValue(fullyQualifiedName) : () => {},
  });

  const isUnchanged = (before, after) => {
    return before.name === after.name && before.uid === after.uid && isEqual(before.fieldValue, after.fieldValue);
  }

  return (
    <ContextFilter of={FormContext} to={FieldContext} map={map} isUnchanged={isUnchanged}>
      {children}
    </ContextFilter>
  )
}

const FieldTag = ({className, tag, children}) => {
  const Tag = !!tag ? tag 
    : className ? 'div' : React.Fragment;
    
  const props = Tag !== React.Fragment ? {className} : {}

  return (
      <Tag {...props}>{children}</Tag>
  );
}

const Field = ({className, tag, children, name, ...rest}) => (
  <FieldProvider name={makeCamelCaseFieldName(name)} {...rest}>
    <FieldTag tag={tag} className={className}>{children}</FieldTag>
  </FieldProvider>
)


export default Field;
import React, { useState, useContext } from 'react';

import FieldContext from './FieldContext';
import FormContext from './FormContext';
import Field from './Field';
import Multiple from './Multiple';
import makeCamelCaseFieldName from '../util/makeCamelCaseFieldName';
import { Reducer, ReducerFunction } from 'react-traversal';
import { combineObjectPaths } from 'eigencode-shared-utils';
import isEqual from 'lodash/isEqual';
import ContextFilter from 'context-filter';
import flatten from 'lodash/flattenDeep';

const invokeCallback = cb => {cb();}

const getFieldNames = new ReducerFunction({
  reduce: ({unbox, element, isLeaf}) => {
    if(isLeaf) return unbox();
    if (element.type === Field || element.type === Multiple) {
      // we can just the top level field names here - removing them
      // will implicitly remove their descendants
      return [makeCamelCaseFieldName(element.props.name)];
    }
    return unbox();
  },
  shouldUpdate: (a,b) => !isEqual(a,b),
  // todo: Reducer needs to implement unbox correctly to use resultset.
  finalTransform: x => flatten(x).filter(Boolean)
});

export const isConditionalShowing = (when, is, outerName, getValue)  => {
  const saneWhen = Array.isArray(when) ? when : [when]
  const saneOuterName = outerName ? outerName + "." : "";
    
  const saneIs = 
      typeof is === 'function' ? is 
    : Array.isArray(is)        ? (...vals) => is.filter((expected, i) => expected !== vals[i]).length > 0
    :                            (...vals) => vals[0] === is;

  const vals = saneWhen.map(x => getValue(x.startsWith("$") ? x.substring(1) : saneOuterName + x))
  const shouldShow = saneIs(...vals);

  return shouldShow;
}

const ConditionalContext = React.createContext();

const ConditionalOuter = ({when, children}) => {
  const fieldContext = useContext(FieldContext);
  const saneWhen = Array.isArray(when) ? when : [when]
  const saneOuterName = fieldContext ? fieldContext.name + "." : "";

  const map = (formContext) =>  ({
    whenValues: Object.assign({}, ...saneWhen.map(x => {
      const key = x.startsWith("$") ? x.substring(1) : saneOuterName + x;
      return  {[key]: formContext ? formContext.getValue(key) : undefined}
    })),
    deleteValue: formContext ? formContext.deleteValue : () => {}
  });

  const isUnchanged = (one, two) => {
    return isEqual(one.whenValues, two.whenValues);
  }
  
  return (
    <ContextFilter of={FormContext} to={ConditionalContext} map={map} isUnchanged={isUnchanged}>
      {children}
    </ContextFilter>
  );
}

const ConditionalInner = ({when, is, preserveValues, onExpanding = invokeCallback, onCollapsing = invokeCallback, children}) => {
  const fieldContext = useContext(FieldContext);
  const saneOuterName = fieldContext ? fieldContext.name + "." : "";
  
  const { whenValues, deleteValue } = useContext(ConditionalContext)
  const [fields, doSetFields] = useState([]);
  const setFields = newFields => doSetFields(oldFields => 
    isEqual(oldFields, newFields) ? oldFields : newFields
  );

  const shouldShow = isConditionalShowing(when, is, fieldContext && fieldContext.name, key => whenValues[key])

  const [targetVisibility, setTargetVisibility] = useState(shouldShow);
  const [effectiveVisibility, setEffectiveVisibility] = useState(shouldShow);
  //console.log('conditionalInner', whenValues, shouldShow, targetVisibility, effectiveVisibility);

  if (!shouldShow && targetVisibility) {
    setTargetVisibility(false);
    onCollapsing(() => {
      if (!preserveValues) {
        fields.forEach(name => {
          deleteValue(combineObjectPaths(saneOuterName, name))
        });
      }
      setEffectiveVisibility(false)
    })
  }

  if (shouldShow && !targetVisibility) {
    setTargetVisibility(true)
    onExpanding(() => {
      setEffectiveVisibility(true)
    })
  }

  return effectiveVisibility ? (
    <Reducer reducerFunction={getFieldNames} onFinish={setFields}>{children}</Reducer>
  ) : null;
}

const Conditional = ({when, is, preserveValues, onExpanding = invokeCallback, onCollapsing = invokeCallback, children}) => {
  return (
    <ConditionalOuter when={when}>
      <ConditionalInner when={when} is={is} preserveValues={preserveValues} onExpanding={onExpanding} onCollapsing={onCollapsing} children={children}>
        {children}
      </ConditionalInner>
    </ConditionalOuter>
  )
}

export default Conditional;
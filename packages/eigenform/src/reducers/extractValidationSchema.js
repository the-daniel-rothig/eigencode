import YupFragment, { mergeYupFragments, toSchema, when, min, max, oneOf, label } from 'yup-fragment';
import * as yup from 'yup';
import 'yup-extensions';
import { ReducerFunction } from 'react-traversal';

import isEqual from 'lodash/isEqual';

import makeCamelCaseFieldName from '../util/makeCamelCaseFieldName';
import Field from '../form/Field';
import Multiple from '../form/Multiple';
import Conditional from '../form/Conditional';
import NumberInput from '../form/NumberInput';
import EmailInput from '../form/EmailInput';
import Select from '../form/Select';
import Radio from '../form/Radio';
import TextInput from '../form/TextInput';

const dottify = str => typeof str === "string" && str[0] === "$" ? str : `.${str}`

const describeSchema = schemaOrFragment => {
  const schema = toSchema(schemaOrFragment);
  const baseDescribe = schema.describe();

  const fieldsObj = schema.fields ? Object.assign({}, ...Object.keys(schema.fields).map(key => ({
    [key]: describeSchema(schema.fields[key])
  }))) : null;

  const conditions = schema._conditions.map((c,i) => ({
      refs: c.refs.map(r => r.path),
      schema: describeSchema(c.fn())
    }));

  return {
    ...baseDescribe,
    ...(fieldsObj ? {fields: fieldsObj} : {}),
    ...(schema._subType ? {subType: describeSchema(schema._subType)} : {}),
    conditions
  };
}

export const shemasAreEqual = (previous, next) => {
  const s1 = describeSchema(previous);
  const s2 = describeSchema(next);
  
  const res = isEqual(s1, s2);
  return res;

  // return isEqual(
  //   describeSchema(previous),
  //   describeSchema(next)
  // );
}

const shouldUpdate = (previous, next) => {
  return (!next.simpleDescriptor || previous.simpleDescriptor !== next.simpleDescriptor) && 
    (!next._meta || !next._meta.simpleDescriptor || !previous._meta || previous._meta.simpleDescriptor !== next._meta.simpleDescriptor);
}

const getContents = ({element, defaultReturn}) => {
  if (element && element.type && [Multiple, Conditional].includes(element.type)) {
    return element.props.children;
  }
  return defaultReturn;
};

const reduce = ({element, unbox, isLeaf}) => {
  if (isLeaf) {
    return unbox();
  }
  const {props, type} = element;
  if (type === TextInput) {
    return yup.string().meta({simpleDescriptor: 'yup_string'});
  } else if (type === EmailInput) {
    return yup.string().email().meta({simpleDescriptor: 'yup_string_email'});
  } else if (type === NumberInput) {
    return yup.string().matches(/^[0-9]*$/).meta({simpleDescriptor: 'yup_string_numberlike'});
  } else if (type === Select) {
    const allowedValues = (props.options || []).map(opt => 
      typeof opt.value === "string" ? opt.value : typeof opt.label === "string" ? opt.label : opt);
    return oneOf(allowedValues)
  } else if (type === Radio) {
    const allowedValues = [(props.value || props.children || "").toString()]
    return oneOf(allowedValues);
  } else if (type === Field) {
    return unbox(res => {
      const combined = mergeYupFragments(res);
      const fragmentWithThis = mergeYupFragments([
        !props.optional && new YupFragment('requiredStrict'),
        props.name && label(props.name),
        props.validator, 
        combined])
      const name = props.name ? makeCamelCaseFieldName(props.name) : undefined;    
      return name
        ? yup.object().shape({[name]: toSchema(fragmentWithThis) || yup.mixed()}).noUnknown().strict().default(undefined) // bug https://github.com/jquense/yup/issues/678
        : fragmentWithThis;
    })
  } else if (type === Conditional && props.when && props.is) {
    return unbox(res => {
      const combined = mergeYupFragments(res);
      const whenWithDots = Array.isArray(props.when)
        ? props.when.map(dottify) 
        : dottify(props.when);
      return when(whenWithDots, {
        is: props.is,
        then: s => toSchema(mergeYupFragments([s, combined]))
      });
    })
  } else if (type === Multiple) {
    return unbox(res => {
      const combined = mergeYupFragments(res);
      let multiSchemaFragments = [
        !props.optional && new YupFragment('requiredStrict'),
        props.min !== 0 && min(props.min || 1),
        props.max && max(props.max),
        props.name && label(props.name),
        props.validator,
        yup.array(toSchema(combined) || undefined),
      ];
      
      const multiSchema = toSchema(mergeYupFragments(multiSchemaFragments));
      const name = props.name ? makeCamelCaseFieldName(props.name) : undefined;    

      return name
        ? yup.object({[name]: multiSchema}).noUnknown().strict().default(undefined) // bug https://github.com/jquense/yup/issues/678
        : multiSchema;
    })
  } else {
    return unbox(res => {
      return mergeYupFragments(res);
    })
  }
};

const finalTransform = x => toSchema(x[0]);

export default new ReducerFunction({reduce, shouldUpdate, getContents, finalTransform});
import YupFragment, { mergeYupFragments, toSchema, when, min, max, oneOf, label } from 'yup-fragment';
import * as yup from 'yup';
import 'yup-extensions';
import { ReducerFunction } from 'react-traversal';

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

export default ReducerFunction.single(async ({element, unbox, isLeaf}) => {
  if (isLeaf) {
    return await unbox();
  }
  const {props, type} = element;
  if (type === TextInput) {
    return yup.string();
  } else if (type === EmailInput) {
    return yup.string().email();
  } else if (type === NumberInput) {
    return yup.number();
  } else if (type === Select) {
    const allowedValues = (props.options || []).map(opt => 
      typeof opt.value === "string" ? opt.value : typeof opt.label === "string" ? opt.label : opt);
    return  oneOf(allowedValues)
  } else if (type === Radio) {
    const allowedValues = [(props.value || props.children || "").toString()]
    return oneOf(allowedValues);
  } else if (type === Field) {
    const combined = mergeYupFragments(await unbox());
    const fragmentWithThis = mergeYupFragments([
      !props.optional && new YupFragment('requiredStrict'),
      props.name && label(props.name),
      props.validator, 
      combined])
    const name = props.name ? makeCamelCaseFieldName(props.name) : undefined;    
  return name
      ? yup.object().shape({[name]: toSchema(fragmentWithThis) || yup.mixed()}).noUnknown().strict().default(undefined) // bug https://github.com/jquense/yup/issues/678
      : fragmentWithThis;
  } else if (type === Conditional && props.when && props.is) {
    const combined = mergeYupFragments(await unbox(props.children));
    const whenWithDots = Array.isArray(props.when)
      ? props.when.map(dottify) 
      : dottify(props.when);
    return when(whenWithDots, {
      is: props.is,
      then: s => mergeYupFragments([s, combined])
    });
  } else if (type === Multiple) {
    const combined = mergeYupFragments(await unbox(props.children));
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
  } else {
    return mergeYupFragments(await unbox());
  }
});
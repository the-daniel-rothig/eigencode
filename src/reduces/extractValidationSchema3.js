import { mergeYupFragments, toSchema, when, min, max, oneOf } from '../yup-composable/yupFragments2';
import * as yup from 'yup';
import Field from '../form/Field';
import Multiple from '../form/Multiple';
import Conditional from '../form/Conditional';
import makeCamelCaseFieldName from '../util/makeCamelCaseFieldName';
import NumberInput from '../form/NumberInput';
import EmailInput from '../form/EmailInput';
import Select from '../form/Select';
import Radio from '../form/Radio';


const dottify = str => typeof str === "string" && str[0] === "$" ? str : `.${str}`

export default ({element, array}) => {
  const {props, type} = element;
  const combined = mergeYupFragments(array);
  const name = props.name ? makeCamelCaseFieldName(props.name) : undefined;    

  if (element === null || element === undefined) {
    return {};
  } else if (element.type === EmailInput) {
    return yup.string().email();
  } else if (element.type === NumberInput) {
    return yup.number();
  } else if (element.type === Select) {
    const allowedValues = (element.props.options || []).map(opt => 
      typeof opt.value === "string" ? opt.value : typeof opt.label === "string" ? opt.label : opt);
    return  oneOf(allowedValues)
  } else if (element.type === Radio) {
    const allowedValues = [(element.props.value || element.props.children || "").toString()]
    return oneOf(allowedValues);
  } else if (type === Field) {
    const fragmentWithThis = mergeYupFragments([props.validator, combined])
    return name
      ? yup.object({[name]: toSchema(fragmentWithThis) || yup.mixed()}).noUnknown().strict()
      : fragmentWithThis;
  } else if (type === Conditional && props.when && props.is) {
    const whenWithDots = Array.isArray(props.when) 
      ? props.when.map(dottify) 
      : dottify(props.when);
    return when(whenWithDots, {
      is: props.is,
      then: combined
    });
  } else if (type === Multiple) {
    let multiSchemaFragments = [
      props.min !== 0 && min(props.min || 1),
      props.max && max(props.max),
      props.validator,
      yup.array(toSchema(combined) || undefined),
    ];
    
    const multiSchema = toSchema(mergeYupFragments(multiSchemaFragments));

    return name
      ? yup.object({[name]: multiSchema}).noUnknown().strict()
      : multiSchema;
  } else {
    return combined;
  }
}
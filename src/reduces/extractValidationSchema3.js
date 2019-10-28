import YupFragment, { mergeYupFragments, toSchema, when, min, max, oneOf, required } from '../yup-composable/yupFragments2';
import * as yup from 'yup';
import '../yup-composable/additionalMethods'
import Field from '../form/Field';
import Multiple from '../form/Multiple';
import Conditional from '../form/Conditional';
import makeCamelCaseFieldName from '../util/makeCamelCaseFieldName';
import NumberInput from '../form/NumberInput';
import EmailInput from '../form/EmailInput';
import Select from '../form/Select';
import Radio from '../form/Radio';
import TextInput from '../form/TextInput';


const dottify = str => typeof str === "string" && str[0] === "$" ? str : `.${str}`

export default ({element, array}) => {
  const {props, type} = element;
  const combined = mergeYupFragments(array);
  const name = props.name ? makeCamelCaseFieldName(props.name) : undefined;    

  if (element === null || element === undefined) {
    return {};
  } else if (element.type === TextInput) {
    return yup.string();
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
    const fragmentWithThis = mergeYupFragments([
      !props.optional && new YupFragment('requiredStrict'),
      props.validator, 
      combined])
    return name
      ? yup.object({[name]: toSchema(fragmentWithThis) || yup.mixed()}).noUnknown().strict().default(undefined) // bug https://github.com/jquense/yup/issues/678
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
      !props.optional && new YupFragment('requiredStrict'),
      props.min !== 0 && min(props.min || 1),
      props.max && max(props.max),
      props.validator,
      yup.array(toSchema(combined) || undefined),
    ];
    
    const multiSchema = toSchema(mergeYupFragments(multiSchemaFragments));

    return name
      ? yup.object({[name]: multiSchema}).noUnknown().strict().default(undefined) // bug https://github.com/jquense/yup/issues/678
      : multiSchema;
  } else {
    return combined;
  }
}
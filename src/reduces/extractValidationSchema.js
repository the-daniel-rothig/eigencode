import { object, array as yupArray, mixed, string, number } from 'yup';
import Form from './../form/Form';
import Field from './../form/Field';
import Multiple from './../form/Multiple';
import Conditional from './../form/Conditional';
import Select from '../form/Select';
import Radio from '../form/Radio';
import EmailInput from '../form/EmailInput';
import NumberInput from '../form/NumberInput';

const combineObjects = arrayOfObjectsAndUndefineds => {
  const arrayOfObjects = arrayOfObjectsAndUndefineds.filter(Boolean);
  const unnamedSchemas = arrayOfObjects.map(x => x.schema).filter(Boolean);
  const newSchema = unnamedSchemas.length > 0 ? unnamedSchemas.slice(1).reduce((a,b)=> a.concat(b), unnamedSchemas[0]) : null;

  const namedSchemas = arrayOfObjects.map(x=>x.namedSchemas).filter(Boolean);
  const schemasKeys = Object.keys(namedSchemas.reduce((a,b) => ({...a, ...b}), {}))
  const newNamedSchemas = {};
  schemasKeys.forEach(key => {
    const namedSchemas1 = namedSchemas.map(x => x[key]).filter(Boolean);
    if (namedSchemas1.length > 0) {
      newNamedSchemas[key] = namedSchemas1.slice(1).reduce((a,b) => a.concat(b), namedSchemas1[0])
    }
  })

  const allowedValueses = arrayOfObjects.map(x=> x.allowedValues).filter(Boolean);
  const allowedValues = allowedValueses.length > 0 ? allowedValueses.reduce((a1, a2) => a1.concat(a2), []) : null;

  const res = {}

  if (newSchema) res.schema = newSchema;
  if (Object.keys(newNamedSchemas).length > 0) res.namedSchemas = newNamedSchemas;
  if (allowedValues) res.allowedValues = allowedValues;

  return res;
};

export default ({array, element, root}) => {
  const {schema, namedSchemas, allowedValues} = combineObjects(array);

  if (element === null || element === undefined) {
    return {};
  }
  if (element !== root && element.type === Form) {
    // nested forms are ignored
    return {};
  } else if (element.type === EmailInput) {
    return { schema: string().email() }
  } else if (element.type === NumberInput) {
    return { schema: number() }
  } else if (element.type === Select) {
    const allowedValues = (element.props.options || []).map(opt => 
      typeof opt.value === "string" ? opt.value : typeof opt.label === "string" ? opt.label : opt);

    return {allowedValues} 
  } else if (element.type === Radio) {
    const allowedValues = [(element.props.value || element.props.children || "").toString()]
    return {allowedValues};
  } else if (element.type === Field) {
    let combinedSchema =  schema && namedSchemas ? object().shape(namedSchemas).noUnknown().strict().concat(schema) :
                          namedSchemas ? object().shape(namedSchemas).noUnknown().strict() :
                          schema;

    let newSchema = element.props.validator && combinedSchema ? element.props.validator.concat(combinedSchema) :
                    element.props.validator || combinedSchema || null;
                    
    let newSchemaWithWhitelist =  newSchema && allowedValues ? newSchema.oneOf(allowedValues) :
                                  allowedValues ? mixed().oneOf(allowedValues) :
                                  newSchema;
    if (element.props.name) {
      return {namedSchemas: {[element.props.name]: newSchemaWithWhitelist || mixed()}}
    } else {
      return {schema: newSchemaWithWhitelist}
    }
  } else if (element.type === Multiple) {
    if(!schema && !namedSchemas && !element.props.min && !element.props.max && !element.props.validator) {
      return {}
    }
    let newSchema = yupArray();
    let combined =  schema && namedSchemas ? schema.concat(object().shape(namedSchemas).noUnknown().strict()) :
                    namedSchemas ? object().shape(namedSchemas).noUnknown().strict() :
                    schema;
    if (combined) {
      newSchema = newSchema.of(combined)
    }
    if (element.props.validator) {
      newSchema = newSchema.concat(element.props.validator)
    }
    if (element.props.max) {
      newSchema = newSchema.max(element.props.max);
    }
    if (element.props.min !== 0) {
      newSchema = newSchema.min(element.props.min || 1);
    }
    return element.props.name 
      ? {namedSchemas: {[element.props.name]: newSchema}}
      : {schema: newSchema};
  } else if (element.type === Conditional) {
    if (!element.props.when || !element.props.is || (!schema && !namedSchemas)) {
      return combineObjects(array);
    } else {
      const res = {}
      if (schema) {
        res.schema = mixed().when(element.props.when, {
          is: element.props.is,
          then: schema
        })
      }

      if (namedSchemas) {
        res.namedSchemas = {}
        Object.keys(namedSchemas).forEach(key => {
          res.namedSchemas[key] = mixed().when(element.props.when, {
            is: element.props.is,
            then: namedSchemas[key]
          })
        })
      }

      if (allowedValues) {
        res.allowedValues = allowedValues;
      }

      return res;
    }
  } else {
    return combineObjects(array);
  }
}
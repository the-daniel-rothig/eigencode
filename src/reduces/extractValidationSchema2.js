import * as yup from 'yup';
import Field from '../form/Field';
import Multiple from '../form/Multiple';
import Conditional from '../form/Conditional';

const fieldNameRegex = /^(?:the|your|my|their|a|an) (.+)$/
const camelCaseTestRegex = /\b[A-Za-z][a-z0-9]+[A-Z]/

const isNotEmpty = val => {
  return val !== null && val !== undefined &&
    (typeof val !== "object" || Object.keys(val).length > 0) &&
    (!Array.isArray(val) || val.length > 0) 
}

const makeCamelCaseFieldName = name => {
  if (!name) {
    return null;
  }
  if (camelCaseTestRegex.test(name)) {
    const suggestion = name.replace(/[A-Z]/g, s => ` ${s}`).toLowerCase();
    console.error(`field name seems to already be in camelCase: "${name}". This will affect validation messages. Please specify it in mid-sentence case instead (e.g. ${suggestion})`);
  }
  const match = name.match(fieldNameRegex);
  if (!match) {
    console.warn(`field name "${name}" should begin with an article (the, your, my, their, a, an)`);
  }
  const asCamelCase = (match ? match[1] : name).trim().toLowerCase().replace(/[^a-z0-9\s\-]/g, "").replace(/[\s\-]+(.)/g, (match, firstCharacter) => firstCharacter.toUpperCase());
  return asCamelCase;
}

const combine = array => {
  if (!array) return {}

  let errors = array.map(x => x.errors || []).reduce((a,b) => [...a,...b], []);

  const schema = array.map(x => x.schema).filter(isNotEmpty);

  if (schema.length > 1) {
    errors.push("Multiple conflicting schemas found. Only last will be used")
  }
  
  const namedSchemas = {};

  const schemaKeys = Object.keys(Object.assign({}, ...array.map(x=>x.namedSchemas)));
  schemaKeys.forEach(key => {
    const namedSchema = array.map(x => x.namedSchemas && x.namedSchemas[key]).filter(isNotEmpty);

    if (namedSchema.length > 1) {
      errors.push(`${key} -> Multiple conflicting schemas found. Only first will be used`)
    }
    
    namedSchemas[key] = namedSchema[0];
  })

  const allowedValues = array
    .map(x=> x.allowedValues)
    .filter(Boolean)
    .reduce((a,b) => a.concat(b), []);

  const res = {}

  if (isNotEmpty(schema)) res.schema = schema[schema];
  if (isNotEmpty(namedSchemas)) res.namedSchemas = namedSchemas;
  if (isNotEmpty(allowedValues)) res.allowedValues = allowedValues;
  res.errors = errors;

  return res;  
}

export const combineSchemas = (...args) => {
  // check if it IS a validator
  // todo: allow combine different schema types

  const s = args.filter(Boolean)
  if (s.length === 0) return null;
  if (s.length === 1) return s[0];
  return s.slice(1).reduce(
    (a,b) => a.concat(b),
    s[0]
  )
}

const whenify = (when, is, schema) => {
  if (!schema) {
    return undefined;
  }

  return yup.mixed().when(when, {
    is: is,
    then: schema
  })
}

const mapObject = (obj, mapper) => {
  if (!obj) return obj;
  return Object.assign({}, ...Object.keys(obj).map(key => ({[key]: mapper(obj[key])})));
}

export default ({element, array}) => {
  const {props, type} = element;
  const combined = combine(array);
  const combinedSchema = combineSchemas(
    combined.schema, 
    combined.namedSchemas && yup.object().shape(namedSchemas),
    combined.allowedValues && yup.mixed().oneOf(combined.allowedValues));

  const name = props.name ? makeCamelCaseFieldName(props.name) : undefined;    
  const errors = name ? combined.errors.map(x => `${name} -> ${x}`) : combined.errors; 

  const combinedInnerSchema = combined.schema ? combineSchemas(
    combined.schema,
    combined.allowedValues && yup.mixed().oneOf(combined.allowedValues)
  ) : undefined;

  if (type === Field) {
    const schemaWithThisValidator = combineSchemas(!props.optional && yup.mixed().required(), props.validator, combinedSchema) 
    const rtn = { errors }
    if (schemaWithThisValidator && name) {
      rtn.namedSchemas = {[name]: schemaWithThisValidator}
    }
    if (schemaWithThisValidator && !name) {
      rtn.schema = schemaWithThisValidator;
    }
    return rtn;
  } else if (type === Conditional && props.when && props.is) {
    return {
      namedSchemas: mapObject(combine.namedSchemas, ns => whenify(props.when, props.is, ns)),
      schema: whenify(when, is, combinedInnerSchema),
      allowedValues: combined.allowedValues,
      errors
    }
  } else if (type === Multiple) {
    let multiSchema = yup.array()
    if (combinedSchema) {
      multiSchema = multiSchema.of(combinedSchema)
    }
    if (props.min !== 0) {
      multiSchema = multiSchema.min(props.min || 1)
    }
    if (props.max) {
      multiSchema = multiSchema.max(props.max)
    }
    if (props.validator) {
      multiSchema = combineSchemas(multiSchema, props.validator)
    }

    if (props.name) {
      const name = makeCamelCaseFieldName(props.name);
      return {namedSchemas: {[name]: multiSchema}, errors};
    } else {
      return {schema: multiSchema, errors};
    }
  } else {
    return combined;
  }
}
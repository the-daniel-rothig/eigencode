import { mergeYupFragments, toSchema } from './yupHelpers';
import * as yup from 'yup';
import 'yup-extensions';
import { CustomRenderFunction } from 'react-custom-renderer';

import isEqual from 'lodash/isEqual';

import { getSaneName, $isField } from '../form/Field';
import { $isMultiple } from '../form/Multiple';
import { getSaneIs } from '../form/Conditional';
import NumberInput from '../form/NumberInput';
import EmailInput from '../form/EmailInput';
import Select from '../form/Select';
import Radio from '../form/Radio';
import TextInput from '../form/TextInput';
import { $isConditional } from '../form/Conditional';
import Group from '../form/Group';

const dottify = str => typeof str === "string" && str[0] === "$" ? str : `.${str}`

const getSaneLabel = (name, label) => {
  if (!!label) {
    return `${label}`;
  }

  if (typeof name === "string") {
    return name.replace(/(a-z)(A-Z0-9)/g, match => `${match[1]} ${match[2].toLowerCase()}`);
  }

  return "this field";
}

const toNamedFieldSchema = (schemaOrFragment, nameOrNull) => {
  if (!nameOrNull) {
    return schemaOrFragment;
  }

  let fieldSchema = toSchema(schemaOrFragment) || yup.mixed();

  let objectSchema = yup.object().shape({
    [nameOrNull]: fieldSchema
  }).noUnknown().strict().default(undefined); // bug https://github.com/jquense/yup/issues/678

  return objectSchema;
}

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
  return isEqual(
    describeSchema(previous),
    describeSchema(next)
  );
}

const shouldUpdate = (previous, next) => {
  if (!!previous !== !!next) {
    return true;
  }
  
  return (
    (previous !== next) &&
    (!next.simpleDescriptor || previous.simpleDescriptor !== next.simpleDescriptor) && 
    (!next._meta || !next._meta.simpleDescriptor || !previous._meta || previous._meta.simpleDescriptor !== next._meta.simpleDescriptor)
  );
}

const merge = res => ({
  outField: mergeYupFragments(res.map(x => x && x.outField)),
  inField: mergeYupFragments(res.map(x => x && x.inField))
})

const reduce = ({unbox, isLeaf}) => {
  if (isLeaf) {
    return undefined;
  }
  
  return unbox(res => {
    return merge(res);
  })
};

const finalTransform = x => toSchema(x[0].outField || x[0].inField);

const extractValidationSchema = new CustomRenderFunction({reduce, shouldUpdate, finalTransform, suppressWarnings: true});

extractValidationSchema.addReducerRule($isMultiple, ({element, unbox}) => {
  const { props } = element;
  return unbox(res => {
    const combinedFull = merge(res);
    const combined = combinedFull.outField || combinedFull.inField;
    if (!combined) {
      return {};
    }
    let multiSchemaFragments = [
      !props.optional && (s => s.requiredStrict()),
      props.min !== 0 && (s => s.min(props.min || 1)),
      props.max && (s => s.max(props.max)),
      (s => s.label(getSaneLabel(props.name, props.label))),
      props.validator,
      yup.array(toSchema(combined) || undefined),
    ];
    
    const multiSchema = toSchema(mergeYupFragments(multiSchemaFragments));
    const name = getSaneName(props.name, props.label);    

    return {
      outField: toNamedFieldSchema(multiSchema, name)
    };
  })
})

extractValidationSchema.addReducerRule($isConditional, ({element, unbox}) => {
  const { props } = element;
  const saneIs = getSaneIs(props.is, props.includes, props.when);
  return unbox(res => {
    let combinedFull = merge(res);

    if (!combinedFull.inField && !combinedFull.outField) {
      return undefined;
    }

    const whenWithDots = Array.isArray(props.when)
      ? props.when.map(dottify) 
      : dottify(props.when || '');
      
    let resultSchemaIn = combinedFull.inField ? s => s.when(whenWithDots, {
      is: saneIs,
      then: s => toSchema(mergeYupFragments([s, combinedFull.inField]))
    }) : undefined;
      
    let resultSchemaOut = combinedFull.outField ? s => s.when(whenWithDots, {
      is: saneIs,
      then: s => toSchema(mergeYupFragments([s, combinedFull.outField]))
    }) : undefined;

    return {
      inField: resultSchemaIn,
      outField: resultSchemaOut
    };
  })
})

extractValidationSchema.addReducerRule($isField, ({element, unbox}) => {
  const { props } = element; 
  return unbox(res => {
    const combinedFull = merge(res);

    const fragmentWithThis = mergeYupFragments([
      !props.optional && (s => s.requiredStrict()),
      (s => s.label(getSaneLabel(props.name, props.label))),
      props.validator, 
      combinedFull.inField])

    const name = getSaneName(props.name, props.label);

    const outField = mergeYupFragments([
      combinedFull.outField,
      toNamedFieldSchema(fragmentWithThis, name)
    ])

    return { outField }
  })
})

extractValidationSchema.addReducerRule(Group, ({element, unbox}) => {
  return unbox(res => {
    const combined = merge(res); 
    
    const outField = toNamedFieldSchema(
      combined.outField,
      element.props.name
    );

    // throw out remaining inField fragments
    return { outField };
  })
})

extractValidationSchema.addReducerRule(TextInput, () => {
  return {
    inField: yup.string().meta({simpleDescriptor: 'yup_string'})
  }
})

extractValidationSchema.addReducerRule(EmailInput, () => {
  return {
    inField: yup.string().email().meta({simpleDescriptor: 'yup_string_email'})
  };
})

extractValidationSchema.addReducerRule(NumberInput, () => {
  return {
    inField: yup.string().matches(/^[0-9]*$/).meta({simpleDescriptor: 'yup_string_numberlike'})
  };
})

extractValidationSchema.addReducerRule(Select, ({element}) => {
  const { props } = element;
  const allowedValues = (props.options || []).map(opt => 
    typeof opt.value === "string" ? opt.value : typeof opt.label === "string" ? opt.label : opt);
  return { inField: s => s.oneOf(allowedValues) };
})

extractValidationSchema.addReducerRule(Radio, ({element}) => {
  const { props } = element;
  const allowedValues = [(props.value || props.children || "").toString()]
  return { inField: s => s.oneOf(allowedValues) };
});

extractValidationSchema.addGetContentsRule($isConditional, ({element}) => element.props.children)
extractValidationSchema.addGetContentsRule($isMultiple, ({element}) => element.props.children)

export default extractValidationSchema;
import { mergeYupFragments, toSchema } from './yupHelpers';
import * as yup from 'yup';
import 'yup-extensions';
import { ReducerFunction } from 'react-traversal';

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

const dottify = str => typeof str === "string" && str[0] === "$" ? str : `.${str}`

const embeddedFieldsKey = '___EIGENCODE_EMBEDDED_FIELDS';

const getSaneLabel = (name, label) => {
  if (!!label) {
    return `${label}`;
  }

  if (typeof name !== "string") {
    throw new Error('either "label" or "name" property is required on Field');
  }

  return name.replace(/(a-z)(A-Z0-9)/g, match => `${match[1]} ${match[2].toLowerCase()}`);
}

const toNamedFieldSchema = (schemaOrFragment, nameOrNull) => {
  if (!nameOrNull) {
    return schemaOrFragment;
  }

  let fieldSchema = toSchema(schemaOrFragment) || yup.mixed();
  const embeddedFields = fieldSchema._meta && fieldSchema._meta[embeddedFieldsKey];
  fieldSchema = fieldSchema.meta({[embeddedFieldsKey]: undefined});

  let objectSchema = yup.object().shape({
    [nameOrNull]: fieldSchema
  }).noUnknown().strict().default(undefined); // bug https://github.com/jquense/yup/issues/678

  if (embeddedFields) {
    objectSchema = objectSchema.concat(embeddedFields(nameOrNull));
  }

  return objectSchema;
}

const appendToEmbeddedFields = resultSchema => s => {
  const prior = (s._meta && s._meta[embeddedFieldsKey]) || (() => yup.object());
  return s.meta({[embeddedFieldsKey]: name => prior(name).concat(resultSchema(name))});
};

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

const reduce = ({unbox, isLeaf}) => {
  if (isLeaf) {
    return undefined;
  }
  
  return unbox(res => {
    return mergeYupFragments(res);
  })
};

const finalTransform = x => toSchema(x[0]);

const extractValidationSchema = new ReducerFunction({reduce, shouldUpdate, finalTransform, suppressWarnings: true});

extractValidationSchema.addReducerRule($isMultiple, ({element, unbox}) => {
  const { props } = element;
  return unbox(res => {
    const combined = mergeYupFragments(res);
    if (!combined) {
      return undefined;
    }
    let multiSchemaFragments = [
      !props.optional && (s => s.requiredStrict()),
      props.min !== 0 && (s => s.min(props.min || 1)),
      props.max && (s => s.max(props.max)),
      (s => s.label(getSaneLabel(props.name, props.label))),
      props.validator,
      yup.array(toSchema(combined) || undefined),
    ];

    if (toSchema(combined)._meta && toSchema(combined)._meta[embeddedFieldsKey]) {
      // note: this is a bit of a feature gap. It may sometimes make sense to include
      // a top-level field into the Multiple structure - not within a single item but
      // e.g. between the item list and the AddAnother button.
      throw new Error('Fields marked embedded must be nested within another Field');
    }
    
    const multiSchema = toSchema(mergeYupFragments(multiSchemaFragments));
    const name = getSaneName(props.name, props.label);    

    return toNamedFieldSchema(multiSchema, name);
  })
})

extractValidationSchema.addReducerRule($isConditional, ({element, unbox}) => {
  const { props } = element;
  const saneIs = getSaneIs(props.is, props.includes, props.when);
  return unbox(res => {
    let combined = mergeYupFragments(res);
    if (!combined) {
      return undefined;
    }

    const whenWithDots = Array.isArray(props.when)
      ? props.when.map(dottify) 
      : dottify(props.when || '');
      
    let resultSchema = s => s.when(whenWithDots, {
      is: saneIs,
      then: s => toSchema(mergeYupFragments([s, combined]))
    });

    const combinedSchema = toSchema(combined);

    if (combinedSchema._meta && combinedSchema._meta[embeddedFieldsKey]) {
      const conditionalEmbedded = name => yup.object().when(dottify(name), {
        is: saneIs,
        then: combinedSchema._meta[embeddedFieldsKey](name)
      });
      const oldResultSchema = resultSchema;
      resultSchema = s => oldResultSchema(s).meta({ [embeddedFieldsKey]: conditionalEmbedded });
    }
    return resultSchema;

  })
})

extractValidationSchema.addReducerRule($isField, ({element, unbox}) => {
  const { props } = element; 
  return unbox(res => {
    const combined = mergeYupFragments(res);
    const fragmentWithThis = mergeYupFragments([
      !props.optional && (s => s.requiredStrict()),
      (s => s.label(getSaneLabel(props.name, props.label))),
      props.validator, 
      combined])
    const name = getSaneName(props.name, props.label);
    const resultSchema = toNamedFieldSchema(fragmentWithThis, name)
    return props.embedded
      ? appendToEmbeddedFields(() => resultSchema)
      : resultSchema;
  })
})

extractValidationSchema.addReducerRule(TextInput, () => {
  return yup.string().meta({simpleDescriptor: 'yup_string'});
})

extractValidationSchema.addReducerRule(EmailInput, () => {
  return yup.string().email().meta({simpleDescriptor: 'yup_string_email'});
})

extractValidationSchema.addReducerRule(NumberInput, () => {
  return yup.string().matches(/^[0-9]*$/).meta({simpleDescriptor: 'yup_string_numberlike'});
})

extractValidationSchema.addReducerRule(Select, ({element}) => {
  const { props } = element;
  const allowedValues = (props.options || []).map(opt => 
    typeof opt.value === "string" ? opt.value : typeof opt.label === "string" ? opt.label : opt);
  return s => s.oneOf(allowedValues)
})

extractValidationSchema.addReducerRule(Radio, ({element}) => {
  const { props } = element;
  const allowedValues = [(props.value || props.children || "").toString()]
  return s => s.oneOf(allowedValues);
});

extractValidationSchema.addGetContentsRule($isConditional, ({element}) => element.props.children)
extractValidationSchema.addGetContentsRule($isMultiple, ({element}) => element.props.children)

export default extractValidationSchema;
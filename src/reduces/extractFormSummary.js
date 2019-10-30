import React from 'react'
import Field, { FieldProvider } from "../form/Field";
import flatten from "lodash/flattenDeep"
import Label from "../form/Label";
import { traverseDepthFirst } from "../util/reactTraversal";
import extractText from "./extractText";
import TextInput from "../form/TextInput";
import InputBase from "../form/InputBase";
import Radio from "../form/Radio";
import Select from "../form/Select";
import Conditional, { isConditionalShowing } from "../form/Conditional";
import FormContext from "../form/FormContext";
import FieldContext from "../form/FieldContext";
import { deepGet } from "../util/objectTraversal";
import makeCamelCaseFieldName from "../util/makeCamelCaseFieldName";
import Multiple from "../form/Multiple";

const firstValueOfType = (array, ...type) => 
  allOfType(array, ...type).map(x=>x.val)[0]
const allOfType = (array, ...type) => 
  array.filter(x => type.includes(x.type))

export default (values, identifySection = () => false) => async ({unbox, element, getContext}) => {
  const fullyQualifiedName = (rawName) => {
    const fieldContext = getContext(FieldContext);
    return `${fieldContext && fieldContext.name ? fieldContext.name + "." : ""}${makeCamelCaseFieldName(rawName)}`;
  } 

  if (!element || typeof element !== "object") {
    return undefined;
  }
  const section = await identifySection({element, unbox});
  if (!!section || typeof section === "string") {
    const contents = flatten(await unbox()).filter(Boolean);
    return {
      type: 'section',
      label: section,
      contents
    }
  }
  if (element.type === Label) {
    const textContent = (await unbox(element.props.children, extractText)).map(x => x.value)[0]; 
    return {
      type: 'label',
      val: textContent
    }
  }
  if (element.type === Field) {
    const children = flatten(await unbox()).filter(Boolean);
    const options = allOfType(children, 'option');
    const fields = allOfType(children, 'field', 'group');
    const dataName = fullyQualifiedName(element.props.name);
    const valueRaw = !fields.length ? deepGet(values, dataName) : undefined; 
    const value = valueRaw && options.find(x => x.value === valueRaw) ? options.find(x => x.value === valueRaw).label : valueRaw; 

    const res = {
      name: element.props.name || '',
      label: firstValueOfType(children, 'label'),
      
      ...(options.length ? {options} : {}),
      ...(fields.length ? {fields} : {}),
      ...(value ? {value} : {}),

      type: fields.length ? 'group' : 'field'
    }

    return res;
  }

  if (element.type === Conditional) {
    const outerFieldContext = getContext(FieldContext);

    const shouldShow = isConditionalShowing(element.props.when, element.props.is, outerFieldContext && outerFieldContext.name, x => deepGet(values, x));
    const children = flatten(await unbox(element.props.children)).filter(Boolean)
    return children.map(x => !shouldShow && ['field', 'group'].includes(x.type) ? {...x, concealed: true} : x)
  }

  if (element.type === Multiple) {
    const dataName = fullyQualifiedName(element.props.name);
    const value = deepGet(values, dataName);
    const valueArray = Array.isArray(value) ? value : [];

    return {
      type: 'multiple',
      name: element.props.name,
      entries: await Promise.all(valueArray.map(async (entry, idx) => {
        const name = `${makeCamelCaseFieldName(element.props.name)}[${idx}]`;
        const children = flatten(await unbox(<FieldProvider name={name}>{element.props.children}</FieldProvider>)).filter(Boolean)
        return children;
      }))
    }

  }
  
  if (element.type === Radio) {
    return {
      type: 'option',
      label: (await unbox(element.props.children, extractText)).map(x => x.value)[0],
      value: element.props.value
    }
  }
  if (element.type === "option") {
    return {
      type: 'option',
      label: element.props.children,
      value: element.props.value
    }
  }
  const inner = await unbox();
  return flatten(inner).filter(Boolean)
} 
import { deepGet } from "eigencode-shared-utils";
import { textRenderer, CustomRenderFunction } from "react-custom-renderer";

import Conditional, { isConditionalShowing } from "../form/Conditional";
import Field, { getSaneName } from "../form/Field";
import GroupContext from "../form/GroupContext";
import Label from "../form/Label";
import Multiple from "../form/Multiple";
import Radio from "../form/Radio";

const firstValueOfType = (array, ...type) => 
  allOfType(array, ...type).map(x=>x.val)[0]
const allOfType = (array, ...type) => 
  array.filter(x => type.includes(x.type))

const makeReduce = (values, identifySection = () => false) => ({element, getContext, isLeaf, unbox}) => {
  const fullyQualifiedName = (rawName, rawLabel) => {
    const groupContext = getContext(GroupContext);
    return `${groupContext && groupContext.name ? groupContext.name + "." : ""}${getSaneName(rawName, rawLabel)}`;
  } 

  if (isLeaf) {
    return unbox();
  }

  if (element.type === Field) {
    return unbox(children => {
      const options = allOfType(children, 'option');
      const fields = allOfType(children, 'field', 'group');
      const dataName = fullyQualifiedName(element.props.name, element.props.label);
      const valueRaw = !fields.length ? deepGet(values, dataName) : undefined; 
      const value = valueRaw && options.find(x => x.value === valueRaw) 
        ? options.find(x => x.value === valueRaw).label 
        : valueRaw; 

      const res = {
        name: getSaneName(element.props.name, element.props.label) || '',
        label: firstValueOfType(children, 'label'),
        
        ...(options.length ? {options} : {}),
        ...(fields.length ? {fields} : {}),
        ...(value ? {value} : {}),

        type: fields.length ? 'group' : 'field'
      }

      return res;
    })
  }

  if (element.type === Conditional) {
    const group = getContext(GroupContext);
    const shouldShow = isConditionalShowing(element.props.when, element.props.is, element.props.includes, group && group.name, x => deepGet(values, x));
    return unbox(c2 => {
      return c2.map(x => !shouldShow && ['field', 'group'].includes(x.type) ? {...x, concealed: true} : x);
    })
  }

  if (element.type === Multiple) {
    const dataName = fullyQualifiedName(element.props.name, element.props.label);
    const value = deepGet(values, dataName);
    const valueArray = Array.isArray(value) ? value : [];

    return unbox(children => {
      const fields = allOfType(children, 'field');
      const multi = {
        type: 'multiple',
        name: getSaneName(element.props.name, element.props.label),
        entries: valueArray.map(entry => {
          // todo: unnamed fields
          return Object.keys(entry).map(key => ({
            ...fields.find(x => x.name === key),
            value: entry[key]
          }));
        }),
      }

      return multi;
    });
  }

  if (element.type === Label) {
    return unbox(textRenderer, textContent => {
      return {
        type: 'label',
        val: textContent
      }
    })
  }
  
  if (element.type === Radio) {
    return unbox(textRenderer, label => ({
      type: 'option',
      label,
      value: element.props.value
    }));
  }

  if (element.type === "option") {
    return {
      type: 'option',
      label: element.props.children,
      value: element.props.value
    }
  }
  
  return unbox(contents => {
    return unbox(identifySection, section => {
      if (typeof section === "string") {
        return {
          type: 'section',
          label: section,
          contents
        };
      }
      return contents;
    })
  })
}

const getContents = ({element, defaultReturn}) => {
  return [Conditional, Multiple].includes(element.type) ? element.props.children : defaultReturn;
};

export default (...args) => new CustomRenderFunction({
  reduce: makeReduce(...args),
  getContents
});
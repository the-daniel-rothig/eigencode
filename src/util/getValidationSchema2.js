import React from 'react';
import { object, array as yupArray, mixed } from 'yup';
import Form from './../form/Form';
import Field from './../form/Field';
import Multiple from './../form/Multiple';
import Conditional from './../form/Conditional';
import ReactDOMServer from 'react-dom/server';
import { traverseWidthFirst, traverseDepthFirst } from './reactTraversal';


/// [{"": string().required()}]
/// [{"bar": date()}]
const combineObjects = arrayOfObjects => arrayOfObjects.filter(Boolean).reduceRight((agg, cur) => ({...agg, ...cur}), {});

const unwindSubSchema = combo => {
  const noNameVal = combo[""] || null;
  delete combo[""];
  const nestedVal = Object.keys(combo).length ? object(combo) : null;
  return [noNameVal, nestedVal]
}

export default root => {
  let theForm = null;
  traverseWidthFirst(root, el => {
    if (el.type === Form) {
      theForm = el;
      return true;
    }
  });

  // if no form element is found, assume we are processing
  // a section of a form
  const formRoot = theForm || root;

  const reduced = traverseDepthFirst(formRoot,
    ({array, element}) => {
      const [noNameVal, nestedVal] = unwindSubSchema(combineObjects(array));

      if (element !== formRoot && element.type === Form) {
        // nested forms are ignored
        return null;    
      } else if (element.type === Field) {
        let thisVal = element.props.validator && noNameVal ? noNameVal.concat(thisVal) :
          element.props.validator || noNameVal || null;
        let combined = thisVal && nestedVal ? nestedVal.concat(thisVal)
          : thisVal || nestedVal || null;
        return combined ? {[element.props.name || ""]: combined} : null;
      } else if (element.type === Multiple) {
        const ofVal = nestedVal && noNameVal ? nestedVal.concat(noNameVal) :
          noNameVal || nestedVal || null;
        if(!ofVal && !element.props.min && !element.props.max && !element.props.validator) {
          return null
        }
        let schema = yupArray();
        if (ofVal) {
          schema = schema.of(ofVal)
        }
        if (element.props.validator) {
          schema = schema.concat(element.props.validator)
        }
        if (element.props.max) {
          schema = schema.max(element.props.max);
        }
        if (element.props.min !== 0) {
          schema = schema.min(element.props.min || 1);
        }
        return {[element.props.name || ""]: schema};
      } else if (element.type === Conditional) {
        if (!element.props.when || !element.props.is) {
          return combineObjects(array);
        } else {
          const combo = combineObjects(array);
          if (Object.keys(combo).length ===0) {
            return null;
          }
          const res = {}
          Object.keys(combo).forEach(key => 
            res[key] = mixed().when(element.props.when, {
            is: element.props.is,
            then: combo[key]
          }));
          return res;
        }
      } else {
        return combineObjects(array);
      }
    }
  );

  const [noNameVal, nestedVal] = unwindSubSchema(reduced)
  return noNameVal && nestedVal ? nestedVal.concat(noNameVal) : noNameVal || nestedVal || mixed();
}
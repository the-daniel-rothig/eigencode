import React from 'react';
import { object, array, mixed } from 'yup';
import Form from './../form/Form';
import Field from './../form/Field';
import Multiple from './../form/Multiple';
import Conditional from './../form/Conditional';
import ReactDOMServer from 'react-dom/server';

function getUpdater(element, Component) {
  var queue = [];
  var replace = false;
  var updater = {
    isMounted: () => false,
    enqueueForceUpdate: () => false,
    enqueueReplaceState: () => false,
    enqueueSetState: () => false,
  };
  return updater;
}

const tryToDive = (element, seekingForm) => {
  if (typeof element.type === 'string' || element.type instanceof String) {
    return shapeFromChildren(element.props.children, seekingForm);
  }

  let innerChild = null;
  try {
    innerChild = element.type(element.props);
  } catch {
    
  }

  const innerResults = innerChild && shapeFromChild(innerChild, seekingForm)
  if (innerResults && Object.keys(innerResults).length) {
    return innerResults
  }

  return element.props && element.props.children
    ? shapeFromChildren(element.props.children, seekingForm)
    : {};
}

const shapeFromChild = (child, seekingForm) => {
  if (seekingForm) {
    if (child.type === Form) {
      return shapeFromChildren(child.props.children, false);
    } else {
      return tryToDive(child, seekingForm);
    }
  }

  if (child.type === Form) {
    // nested forms are ignored
    return {};    
  } else if (child.type === Field) {
    // todo: deal better with nested fields
    // todo: deal with unnamed fields
    const validator = child.props.validator || shapeFromChildren(child.props.children);
    return validator && Object.keys(validator).length ? {[child.props.name]: validator} : {};
  } else if (child.type === Multiple) {
    const innerShape = shapeFromChildren(child.props.children);
    return innerShape ? {[child.props.name]: array().of(object().shape(innerShape))} : {};
  } else if (child.type === Conditional) {
    const shape = shapeFromChildren(child.props.children);
    if (child.props.when && child.props.is) {
      Object.keys(shape).forEach(key => {
        shape[key] = mixed().when(child.props.when, {
          is: child.props.is,
          then: shape[key]
        });
      });
    }
    return shape;
  } else {
    return tryToDive(child, seekingForm);
  }  
}

const shapeFromChildren = (children, seekingForm) => {
  if (!children) {
    return {};
  }

  let res = {};

  //React.Children.forEach(children, child => {
  const childrenArray = React.Children.toArray(children);
  for(var i = 0; i < childrenArray.length; i++) {
    const fragment = shapeFromChild(childrenArray[i], seekingForm);
    res = {...res, ...fragment};
  }
  //})

  return res;
}

export default (formElement) => {
  debugger;
  ReactDOMServer.renderToString(formElement);
  const shape = shapeFromChild(formElement, true);
  return shape 
    ? object().shape(shape)
    : mixed();
}
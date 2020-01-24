import React from 'react';
import $isPlaceholder from './isPlaceholder';

export const InlinePropCombiner = () => null;

const makeCombiner = (parts, mappingFn) => {
  const props = { parts, mappingFn }
  const element = <InlinePropCombiner {...props} />

  return {
    ...element,
    map: cb => makeCombiner(parts, (...args) => cb(mappingFn(...args)))
  };
}

export const combine = (arrayOfInlineProps, map) => {
  if (!Array.isArray(arrayOfInlineProps)) {
    throw new Error(`combine was passed a ${typeof arrayOfInlineProps} as its first parameter, expected an array of inline props`)
  }

  if (arrayOfInlineProps.length < 1 || arrayOfInlineProps.filter(x => !x || !x[$isPlaceholder]).length) {
    throw new Error("The first argument of combine must be a nonempty array of inline props");
  }

  if (typeof map !== "function") {
    throw new Error("The second argument of combine must be a function");
  }

  return makeCombiner(arrayOfInlineProps, map);
}
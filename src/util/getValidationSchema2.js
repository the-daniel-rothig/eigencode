import { object, mixed } from 'yup';
import { traverseDepthFirst } from './reactTraversal';
import extractValidationSchema from '../reduces/extractValidationSchema';

export default root => {
  let theForm = null;
  
  // if no form element is found, assume we are processing
  // a section of a form
  const formRoot = theForm || root;

  const reduced = traverseDepthFirst(formRoot, extractValidationSchema)

  const { allowedValues, namedSchemas, schema } = reduced;
  const combined =  namedSchemas && schema ? schema.concat(object().shape(namedSchemas).noUnknown().strict()) :
                    namedSchemas ? object().shape(namedSchemas).noUnknown().strict() :
                    schema;

  const combined1 = combined && allowedValues ? combined.oneOf(allowedValues) :
                    allowedValues ? mixed().oneOf(allowedValues) :
                    combined;

  return combined1;
}
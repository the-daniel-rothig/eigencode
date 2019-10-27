import * as yup from 'yup';
import yupFragment, * as yupFragments from "./yupFragments2"

const { array, object, string, mixed } = yup;
const { mergeYupFragments, notRequired, required, label } = yupFragments;


describe('yupFragments module', () => {
  const knownNonBuilderMethods = [
    "clone", 
    "withMutation", 
    "isType", 
    "resolve", 
    "cast", 
    "validate", 
    "validateSync", 
    "isValid", 
    "isValidSync", 
    "getDefault", 
    "default", //exported as defaultValue
    "describe", 
    "validateAt", 
    "validateSyncAt",
  ]

  const yupExtensionMethods = new Set();

  Object.keys(yup).forEach(key => {
    if (!yup[key].prototype || !yup[key].prototype.__isYupSchema__) {
      return;
    }
    if (typeof yup[key] === "function" && yup.isSchema(yup[key]())) {
      const schema = yup[key]();
      for (let key2 in schema) {
        if (key2[0] !== "_" && typeof schema[key2] === "function") {
          yupExtensionMethods.add(key2)
        }
      }
    }
  })

  it('exports the right convenience methods', () => {
    let builderMethodsNotExportedByFragments = []

    yupExtensionMethods.forEach(key => {
      if (typeof yupFragments[key] !== "function") {
        builderMethodsNotExportedByFragments.push(key);
      }
    })

    expect(builderMethodsNotExportedByFragments).toStrictEqual(knownNonBuilderMethods)
  })

  it('exposes the right methods on yupFragment', () => {
    let builderMethodsNotOnYupFragment = []

    yupExtensionMethods.forEach(key => {
      if (typeof yupFragment[key] !== "function") {
        builderMethodsNotOnYupFragment.push(key);
      }
    })

    expect(builderMethodsNotOnYupFragment).toStrictEqual(knownNonBuilderMethods)
  })
})

describe('chain methods', () => {
  it('prefers later methods', () => {
    const requiredChain = notRequired().required().applyToSchema();
    const notRequiredChain = required().notRequired().applyToSchema();
    expect(requiredChain.isValidSync(undefined)).toBe(false)
    expect(notRequiredChain.isValidSync(undefined)).toBe(true)
  })
})

describe('mergeYupFragments', () => {
  it ('keeps fragments fragments', () => {
    const merged = mergeYupFragments([
      label('surrender'),
      required('${label} is not an option')
    ])

    expect(merged.__isYupFragment__).toBe(true)
  })

  it('works with schemas', () => {
    const merged = mergeYupFragments([
      mixed(),
      label('surrender'),
      required('${label} is not an option')
    ])

    expect(yup.isSchema(merged)).toBe(true);
    expect(() => merged.validateSync(undefined)).toThrow('surrender is not an option')
  })

  it('works with schemas in the middle', () => {
    const merged = mergeYupFragments([
      label('surrender'),
      mixed(),
      required('${label} is not an option')
    ])

    expect(yup.isSchema(merged)).toBe(true);
    expect(() => merged.validateSync(undefined)).toThrow('surrender is not an option') 
  })

  it('works with schemas at the end', () => {
    const merged = mergeYupFragments([
      label('surrender'),
      required('${label} is not an option'),
      mixed()
    ])

    expect(yup.isSchema(merged)).toBe(true);
    expect(() => merged.validateSync(undefined)).toThrow('surrender is not an option') 
  })

  it('works with multiple schemas in the mix', () => {
    const merged = mergeYupFragments([
      label('surrender'),
      string().max(2, "${label} is taking too long"),
      required('${label} is not an option'),
      string()
    ])
    
    expect(yup.isSchema(merged)).toBe(true);
    expect(() => merged.validateSync(undefined)).toThrow('surrender is not an option') 
    expect(() => merged.validateSync("123")).toThrow('surrender is taking too long') 
  })

  it('throws the normal yup error when trying to merge mismatching validators', () => {
    expect(() => mergeYupFragments([string(), mixed()])).toThrow(/of different types/)
  })

  it('prefers later fragments', () => {
    const requiredMerged = mergeYupFragments([
      notRequired(),
      required()
    ]);

    const notRequiredMerged = mergeYupFragments([
      required(),
      notRequired()
    ]);

    expect(requiredMerged.applyToSchema().isValidSync(undefined)).toBe(false);
    expect(notRequiredMerged.applyToSchema().isValidSync(undefined)).toBe(true);
  })
})

describe('exploratory yup tests', () => {
  it('inline assignment', () => {
    let foo = undefined;

    let bar = foo || (foo = 'done');
    expect(foo).toBe('done')
    expect(bar).toBe('done')
  })

  it('building up oneOf DOES work in vanilla yup', () => {
    const schema = mixed().oneOf(['one']).oneOf(['two'])
  
    expect(schema.isValidSync('one')).toBe(true);
    expect(schema.isValidSync('two')).toBe(true);
    expect(schema.isValidSync('three')).toBe(false);
  })  

  it('label can be set later', () => {
    const val = string()
      .label('before')
      .required()
      .label('after')

    expect(() => val.validateSync(undefined)).toThrow(/after/)
    
  })

  it('getting schemas', () => {
    expect(yup.boolean.prototype.__isYupSchema__).toBe(true);
  })

  it('when and object shape', () => {
    const schema1 = object({
      one: string()
    }).when('.one', {
      is: 'foo',
      then: object({
        two: string().matches(/foo/)
      })
    });
    
    const schema2 = object({
      three: string().matches(/foo/)
    })

    const schema = schema1.concat(schema2);

    expect(schema.isValidSync({one: 'bar', two: 'bar', three: 'foo'})).toBe(true)
    expect(schema.isValidSync({one: 'bar', two: 'bar', three: 'bar'})).toBe(false)
    expect(schema.isValidSync({one: 'foo', two: 'bar', three: 'foo'})).toBe(false)
    expect(schema.isValidSync({one: 'foo', two: 'foo', three: 'foo'})).toBe(true)
  })

  it('enforces required object fields', () => {
    const schema = object({
      a: object({
        b: mixed()
      }).required(),
    })

    expect(schema.isValidSync({a: {b: 'foo'}})).toBe(true)
    expect(schema.isValidSync({a: {b: undefined}})).toBe(true)
    expect(schema.isValidSync({a: {}})).toBe(true)
    expect(schema.isValidSync({a: null})).toBe(false)
    expect(schema.isValidSync({a: undefined})).toBe(false) // fails
    expect(schema.isValidSync({})).toBe(false) // fails
  })
});
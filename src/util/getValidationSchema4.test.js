import React from 'react';
import { traverseDepthFirst } from "./reactTraversal"
import Field from "../form/Field"
import * as yup from 'yup';
import extractValidationSchema3 from '../reduces/extractValidationSchema3';
import { toSchema } from '../yup-composable/yupFragments2';
import Conditional from '../form/Conditional';
import Multiple from '../form/Multiple';
import Select from '../form/Select';
import Radio from '../form/Radio';
import EmailInput from '../form/EmailInput';
import NumberInput from '../form/NumberInput';

const getValidationSchema4 = elem => {
  const res = traverseDepthFirst(elem, extractValidationSchema3)
  return toSchema(res);
}

const myValidator = yup.string().matches(/foo/)
const expectPasses = (schema, val) => expect(schema.isValidSync(val, {context: val})).toBe(true);
const expectFails = (schema, val) => expect(schema.isValidSync(val, {context: val})).toBe(false);


it('works on a simple field', () => {
  const schema = getValidationSchema4(<Field validator={myValidator} />)
  expectPasses(schema, "foo");
  expectFails(schema, "bar");
})

it('works with two named fields', () => {
  const schema = getValidationSchema4(
    <>
      <Field name='one' validator={myValidator} />
      <Field name='two' validator={myValidator} />
    </>
  )

  expectPasses(schema, {one: 'foo', two: 'foo'})
  expectFails(schema, {one: 'foo', two: 'bar'});
})

it('works with named Field in Conditional', () => {
  const schema = getValidationSchema4(
    <>
      <Field name='one' validator={myValidator} />
      <Conditional when='one' is='foobar'>
        <Field name='two' validator={myValidator} />
        <Field name='three' validator={myValidator} />
      </Conditional>
    </>
  )

  expectPasses(schema, {one: 'foo'})
  expectFails(schema, {one: 'foo', two: 'foo', three: 'foo'})
  expectFails(schema, {one: 'foobar', two: 'bar', three: 'bar'})
  expectPasses(schema, {one: 'foobar', two: 'foo', three: 'foo'})
})

it('works with Multiple', () => {
  const schema = getValidationSchema4(
    <>
      <Multiple name='firstNames'>
        <Field validator={myValidator} />
      </Multiple>
      <Field name='lastName' validator={myValidator} />
    </>
  )
  
  expectPasses(schema, {firstNames: ["foo", "foo"], lastName: "foo"});
  expectFails(schema, {firstNames: "foo", lastName: "foo"});
})

it('works with named Fields within Multiple', () => {
  const schema = getValidationSchema4(
    <>
      <Multiple name='multi'>
        <Field name='a' validator={myValidator} />
        <Field name='b' validator={myValidator} />
      </Multiple>
      <Field name='c' validator={myValidator} />
    </>
  )

  expectPasses(schema, {multi: [{a: 'foo', b: 'foo'}], c: 'foo'})
})

it('works with unnamed Field in Conditional in Multiple', () => {
  const schema = getValidationSchema4(
    <>
      <Multiple name='multi'>
        <Conditional when='$solo' is='foobar'>
          <Field validator={myValidator} />
        </Conditional>
      </Multiple>
      <Field name='solo' validator={myValidator} />
    </>
  )

  expectPasses(schema, {solo: 'foo', multi: ["bar"]})
  expectFails(schema, {solo: 'foobar', multi: ["bar"]})
  expectPasses(schema, {solo: 'foobar', multi: ["foo"]})
})

it('works with named Field in Conditional in Multiple', () => {
  const schema = getValidationSchema4(
    <>
      <Multiple name='multi'>
        <Conditional when='$solo' is='foobar'>
          <Field name='a' validator={myValidator} />
          <Field name='b' validator={myValidator} />
        </Conditional>
        <Field name='c' validator={myValidator} />
      </Multiple>
      <Field name='solo' validator={myValidator} />
    </>
  )

  expectPasses(schema, {solo: 'foo',    multi: [{c: 'foo'}]})
  expectFails(schema,  {solo: 'foo',    multi: [{c: 'bar'}]})
  expectFails(schema,  {solo: 'foo',    multi: [{a: 'foo', b: 'foo', c: 'foo'}]})
  expectFails(schema,  {solo: 'foobar', multi: [{a: 'bar', b: 'bar', c: 'foo'}]})
  expectPasses(schema, {solo: 'foobar', multi: [{a: 'foo', b: 'foo', c: 'foo'}]})
})

it('works with unnamed Field in unnamed Multiple', () => {
  const schema = getValidationSchema4(
    <Multiple>
      <Field validator={myValidator} />
    </Multiple>
  )

  expectPasses(schema, ['foo'])
  expectPasses(schema, ['foo', 'foo'])
  expectFails(schema, ['foo', 'bar'])
})

it('respects min setting of Multiple', () => {
  const schema = getValidationSchema4(
    <Multiple min={2}>
      <Field validator={myValidator} />
    </Multiple>
  )

  expectFails(schema, [])
  expectFails(schema, ["foo"])
  expectPasses(schema, ["foo", "foo"])
  expectFails(schema, ["foo", "bar"])
  expectPasses(schema, ['foo', 'foo'])
})

it('respects max setting of Multiple', () => {
  const schema = getValidationSchema4(
    <Multiple max={2}>
      <Field validator={myValidator} />
    </Multiple>
  )

  expectPasses(schema, ["foo"])
  expectPasses(schema, ["foo", "foo"])
  expectFails(schema, ["foo", "foo", "foo"])
})

it('doesnt require an optional Multiple instance even if min is set', () => {
  const schema = getValidationSchema4(
    <Multiple name="multi" optional min={2} />
  )

  expectPasses(schema, {})
})

it('works with nested fields', () => {
  const OptField = (props) => <Field optional {...props} />
  const req = yup.mixed().required();

  const one = getValidationSchema4(<OptField name="a"><OptField name="b" validator={req} /></OptField>)
  expectPasses(one, {a: {b: "foo"}})
  expectFails(one, {a: {}})

  const two = getValidationSchema4(<OptField><OptField name="b" validator={req} /></OptField>)
  expectPasses(two, {b: "foo"})
  expectFails(two, {})

  const three = getValidationSchema4(<OptField name="a"><OptField validator={req} /></OptField>)
  expectPasses(three, {a: "foo"})
  expectFails(three, {})

  const four = getValidationSchema4(<OptField><OptField validator={req} /></OptField>)
  expectPasses(four, "foo")
  expectFails(four, null)

  const five = getValidationSchema4(<OptField validator={req} name="a"><OptField name="b" /></OptField>)
  expectPasses(five, {a: {b: "foo"}})
  expectFails(five, {})

  const six = getValidationSchema4(<OptField validator={req}><OptField name="b" /></OptField>)
  expectPasses(six, {})
  expectFails(six, null)

  const seven = getValidationSchema4(<OptField validator={req} name="a"><OptField /></OptField>)
  expectPasses(seven, {a: "foo"})
  expectFails(seven, {})

  const eight = getValidationSchema4(<OptField validator={req}><OptField /></OptField>)
  expectPasses(eight, "foo")
  expectFails(eight, null)
})

it('uses Select values to filter allowed values', () => {
  const schema = getValidationSchema4(
    <Field>
      <Select options={['one', 'two']} />
    </Field>
  )

  expectPasses(schema, 'one')
  expectPasses(schema, 'two')
  expectFails(schema, 'three')
})

it('uses Radio values to filter allowed values', () => {
  const schema = getValidationSchema4(
    <Field>
      <Radio value='one'>One</Radio>
      <Radio value='two'>Two</Radio>
    </Field>
  )

  expectPasses(schema, 'one')
  expectPasses(schema, 'two')
  expectFails(schema, 'three')
})

it('restricts fields to email if there is an EmailInput', () => {
  const schema = getValidationSchema4(
    <Field>
      <EmailInput />
    </Field>
  )

  expectPasses(schema, "daniel@example.com")
  expectFails(schema, "danielexamplecom")
})

it('restricts fields to number if there is a NumberInput', () => {
  const schema = getValidationSchema4(
    <Field>
      <NumberInput />
    </Field>
  )

  expectPasses(schema, "42")
  expectFails(schema, "foo")
})

it('doesnt tolerate unknown fields: root', () => {
  const schema = getValidationSchema4(
    <>
      <Field name="one" validator={myValidator}/>
      <Field name="two" />
    </>
  )

  expectPasses(schema, {one: 'foo', two: 'bar'})
  expectFails(schema, {one: 'foo', two: 'bar', three: 'baz'})
})

it('doesnt tolerate unknown fields: nested', () => {
  const schema = getValidationSchema4(
    <Field name="root">
      <Field name="one" validator={myValidator}/>
      <Field name="two" />
    </Field>
  )

  expectPasses(schema, {root: {one: 'foo', two: 'bar'}})
  expectFails(schema, {root: {one: 'foo', two: 'bar', three: 'baz'}})
})

it('enforces required by default: unnamed Field', () => {
  const schema = getValidationSchema4(<Field />);
  expectPasses(schema, 'hello');
  expectFails(schema, '');
  expectFails(schema, undefined);
})

it('enforces requiredStrict by default: named Field', () => {
  const schema = getValidationSchema4(<Field name='one'/>);
  expectPasses(schema, {one: 'hello'});
  expectFails(schema, {one: ''});
  expectFails(schema, {one: undefined});
  expectFails(schema, {});
})
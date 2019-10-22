import React from 'react';
import {string,mixed} from 'yup';
import getValidationSchema2 from './getValidationSchema2';
import Field from '../form/Field';
import Form from '../form/Form';
import TextInput from '../form/TextInput';
import Conditional from '../form/Conditional';
import Multiple from '../form/Multiple';
import Select from '../form/Select';
import Radio from '../form/Radio';
import EmailInput from '../form/EmailInput';
import NumberInput from '../form/NumberInput';

const myValidator = string().matches(/foo/)
const expectPasses = (schema, val) => expect(schema.isValidSync(val, {context: val})).toBe(true);
const expectFails = (schema, val) => expect(schema.isValidSync(val, {context: val})).toBe(false);

it('works on a simple field', () => {
  const schema = getValidationSchema2(<Field validator={myValidator} />)
  expectPasses(schema, "foo");
  expectFails(schema, "bar");
})

it('works with two named fields', () => {
  const schema = getValidationSchema2(
    <>
      <Field name='one' validator={myValidator} />
      <Field name='two' validator={myValidator} />
    </>
  )

  expectPasses(schema, {one: 'foo', two: 'foo'})
  expectFails(schema, {one: 'foo', two: 'bar'});
})

it('works with named Field in Conditional', () => {
  const schema = getValidationSchema2(
    <>
      <Field name='one' validator={myValidator} />
      <Conditional when='one' is='foobar'>
        <Field name='two' validator={myValidator} />
        <Field name='three' validator={myValidator} />
      </Conditional>
    </>
  )

  expectPasses(schema, {one: 'foo', two: 'bar', three: 'bar'})
  expectFails(schema, {one: 'foobar', two: 'bar', three: 'bar'})
  expectPasses(schema, {one: 'foobar', two: 'foo', three: 'foo'})
})

it('works with Multiple', () => {
  const schema = getValidationSchema2(
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
  const schema = getValidationSchema2(
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
  const schema = getValidationSchema2(
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
  const schema = getValidationSchema2(
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

  expectFails(schema,  {solo: 'foo',    multi: [{a: 'bar', b: 'bar', c: 'bar'}]})
  expectPasses(schema, {solo: 'foo',    multi: [{a: 'bar', b: 'bar', c: 'foo'}]})
  expectFails(schema,  {solo: 'foobar', multi: [{a: 'bar', b: 'bar', c: 'foo'}]})
  expectPasses(schema, {solo: 'foobar', multi: [{a: 'foo', b: 'foo', c: 'foo'}]})
})

it('works with unnamed Field in unnamed Multiple', () => {
  const schema = getValidationSchema2(
    <Multiple>
      <Field validator={myValidator} />
    </Multiple>
  )

  expectPasses(schema, ['foo'])
  expectPasses(schema, ['foo', 'foo'])
  expectFails(schema, ['foo', 'bar'])
})

it('respects min setting of Multiple', () => {
  const schema = getValidationSchema2(
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
  const schema = getValidationSchema2(
    <Multiple max={2}>
      <Field validator={myValidator} />
    </Multiple>
  )

  expectPasses(schema, ["foo"])
  expectPasses(schema, ["foo", "foo"])
  expectFails(schema, ["foo", "foo", "foo"])
})

it('doesnt require a Multiple instance even if min is set', () => {
  const schema = getValidationSchema2(
    <Multiple name="multi" min={2} />
  )

  expectPasses(schema, {})
})

it('works with nested fields', () => {
  const req = mixed().required();

  const one = getValidationSchema2(<Field name="a"><Field name="b" validator={req} /></Field>)
  expectPasses(one, {a: {b: "foo"}})
  expectFails(one, {a: {}})

  const two = getValidationSchema2(<Field><Field name="b" validator={req} /></Field>)
  expectPasses(two, {b: "foo"})
  expectFails(two, {})

  const three = getValidationSchema2(<Field name="a"><Field validator={req} /></Field>)
  expectPasses(three, {a: "foo"})
  expectFails(three, {})

  const four = getValidationSchema2(<Field><Field validator={req} /></Field>)
  expectPasses(four, "foo")
  expectFails(four, null)

  const five = getValidationSchema2(<Field validator={req} name="a"><Field name="b" /></Field>)
  expectPasses(five, {a: {b: "foo"}})
  expectFails(five, {})

  const six = getValidationSchema2(<Field validator={req}><Field name="b" /></Field>)
expectPasses(six, {})
  expectFails(six, null)

  const seven = getValidationSchema2(<Field validator={req} name="a"><Field /></Field>)
  expectPasses(seven, {a: "foo"})
  expectFails(seven, {})

  const eight = getValidationSchema2(<Field validator={req}><Field /></Field>)
  expectPasses(eight, "foo")
  expectFails(eight, null)
})

it('uses Select values to filter allowed values', () => {
  const schema = getValidationSchema2(
    <Field>
      <Select options={['one', 'two']} />
    </Field>
  )

  expectPasses(schema, 'one')
  expectPasses(schema, 'two')
  expectFails(schema, 'three')
})

it('uses Radio values to filter allowed values', () => {
  const schema = getValidationSchema2(
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
  const schema = getValidationSchema2(
    <Field>
      <EmailInput />
    </Field>
  )

  expectPasses(schema, "daniel@example.com")
  expectFails(schema, "danielexamplecom")
})

it('restricts fields to number if there is a NumberInput', () => {
  const schema = getValidationSchema2(
    <Field>
      <NumberInput />
    </Field>
  )

  expectPasses(schema, "42")
  expectFails(schema, "foo")
})

it('doesnt tolerate unknown fields: root', () => {
  const schema = getValidationSchema2(
    <>
      <Field name="one" validator={myValidator}/>
      <Field name="two" />
    </>
  )

  expectPasses(schema, {})
  expectPasses(schema, {one: 'foo', two: 'bar'})
  expectFails(schema, {one: 'foo', two: 'bar', three: 'baz'})
})

it('doesnt tolerate unknown fields: nested', () => {
  const schema = getValidationSchema2(
    <Field name="root">
      <Field name="one" validator={myValidator}/>
      <Field name="two" />
    </Field>
  )

  expectPasses(schema, {root: {}})
  expectPasses(schema, {root: {one: 'foo', two: 'bar'}})
  expectFails(schema, {root: {one: 'foo', two: 'bar', three: 'baz'}})
})
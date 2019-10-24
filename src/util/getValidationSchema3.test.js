import React from 'react';
import {string,mixed} from 'yup';
import Field from '../form/Field';
import Form from '../form/Form';
import TextInput from '../form/TextInput';
import Conditional from '../form/Conditional';
import Multiple from '../form/Multiple';
import Select from '../form/Select';
import Radio from '../form/Radio';
import EmailInput from '../form/EmailInput';
import NumberInput from '../form/NumberInput';
import { render } from '@testing-library/react';
import GetValidationSchema from './getValidationSchema3';

const myValidator = string().matches(/foo/)
const expectPasses = (schema, val) => expect(schema.isValidSync(val, {context: val})).toBe(true);
const expectFails = (schema, val) => expect(schema.isValidSync(val, {context: val})).toBe(false);

it('works on a simple field', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Field validator={myValidator} />
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, "foo");
    expectFails(schema, "bar");
    done()
  }
})

it('works with two named fields', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Field name='one' validator={myValidator} />
      <Field name='two' validator={myValidator} />
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, {one: 'foo', two: 'foo'})
    expectFails(schema, {one: 'foo', two: 'bar'});
    done()
  }

})

const setup1 = (initialValues, onFinish) => render( 
  <Form initialValues={initialValues}>
    <GetValidationSchema onFinish={onFinish}>
      <Field name='one' validator={myValidator} />
      <Conditional when='one' is='foobar'>
        <Field name='two' validator={myValidator} />
        <Field name='three' validator={myValidator} />
      </Conditional>
    </GetValidationSchema>
  </Form>
)

it('works with named Field in Conditional', async () => {
  await new Promise(ok => setup1(
    {one: 'foo'}, schema => {
      expectPasses(schema, {one: 'foo'})
      expectFails(schema, {one: 'foo', two: 'foo', three: 'foo'})
      ok()
    }
  ))

  await new Promise(ok => setup1(
    {one: 'foobar'}, schema => {
      expectPasses(schema, {one: 'foobar', two: 'foo', three: 'foo'})
      expectFails(schema, {one: 'foobar', two: 'bar', three: 'bar'})
      ok()
    }
  ))
})

it('works with Multiple', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Multiple name='firstNames'>
        <Field validator={myValidator} />
      </Multiple>
      <Field name='lastName' validator={myValidator} />
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, {firstNames: ["foo", "foo"], lastName: "foo"});
    expectFails(schema, {firstNames: "foo", lastName: "foo"});
    done();
  }
})

it('works with named Fields within Multiple', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Multiple name='multi'>
        <Field name='a' validator={myValidator} />
        <Field name='b' validator={myValidator} />
      </Multiple>
      <Field name='c' validator={myValidator} />
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, {multi: [{a: 'foo', b: 'foo'}], c: 'foo'})
    done()
  }
})
/*
it('works with unnamed Field in Conditional in Multiple', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Multiple name='multi'>
        <Conditional when='$solo' is='foobar'>
          <Field validator={myValidator} />
        </Conditional>
      </Multiple>
      <Field name='solo' validator={myValidator} />
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, {solo: 'foo', multi: ["bar"]})
    expectFails(schema, {solo: 'foobar', multi: ["bar"]})
    expectPasses(schema, {solo: 'foobar', multi: ["foo"]})
    done()
  }
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
*/
it('works with unnamed Field in unnamed Multiple', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Multiple>
        <Field validator={myValidator} />
      </Multiple>
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, ['foo'])
    expectPasses(schema, ['foo', 'foo'])
    expectFails(schema, ['foo', 'bar'])
    done()
  }
})

it('respects min setting of Multiple', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Multiple min={2}>
        <Field validator={myValidator} />
      </Multiple>
    </GetValidationSchema>
  )

  function assert(schema) {
    expectFails(schema, [])
    expectFails(schema, ["foo"])
    expectPasses(schema, ["foo", "foo"])
    expectFails(schema, ["foo", "bar"])
    expectPasses(schema, ['foo', 'foo'])
    done()
  }
})

it('respects max setting of Multiple', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Multiple max={2}>
        <Field validator={myValidator} />
      </Multiple>
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, ["foo"])
    expectPasses(schema, ["foo", "foo"])
    expectFails(schema, ["foo", "foo", "foo"])
    done()
  }
})

it('doesnt require a Multiple instance even if min is set', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Multiple name="multi" min={2} />
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, {})
    done()
  }
})

// it('works with nested fields', () => {
//   const req = mixed().required();

//   const one = getValidationSchema2(<Field name="a"><Field name="b" validator={req} /></Field>)
//   expectPasses(one, {a: {b: "foo"}})
//   expectFails(one, {a: {}})

//   const two = getValidationSchema2(<Field><Field name="b" validator={req} /></Field>)
//   expectPasses(two, {b: "foo"})
//   expectFails(two, {})

//   const three = getValidationSchema2(<Field name="a"><Field validator={req} /></Field>)
//   expectPasses(three, {a: "foo"})
//   expectFails(three, {})

//   const four = getValidationSchema2(<Field><Field validator={req} /></Field>)
//   expectPasses(four, "foo")
//   expectFails(four, null)

//   const five = getValidationSchema2(<Field validator={req} name="a"><Field name="b" /></Field>)
//   expectPasses(five, {a: {b: "foo"}})
//   expectFails(five, {})

//   const six = getValidationSchema2(<Field validator={req}><Field name="b" /></Field>)
// expectPasses(six, {})
//   expectFails(six, null)

//   const seven = getValidationSchema2(<Field validator={req} name="a"><Field /></Field>)
//   expectPasses(seven, {a: "foo"})
//   expectFails(seven, {})

//   const eight = getValidationSchema2(<Field validator={req}><Field /></Field>)
//   expectPasses(eight, "foo")
//   expectFails(eight, null)
// })

it('uses Select values to filter allowed values', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Field>
        <Select options={['one', 'two']} />
      </Field>
    </GetValidationSchema>
  )

  function assert(schema) {  
    expectPasses(schema, 'one')
    expectPasses(schema, 'two')
    expectFails(schema, 'three')
    done()
  }
})

it('uses Radio values to filter allowed values', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Field>
        <Radio value='one'>One</Radio>
        <Radio value='two'>Two</Radio>
      </Field>
    </GetValidationSchema>
  )

  function assert(schema) {  
    expectPasses(schema, 'one')
    expectPasses(schema, 'two')
    expectFails(schema, 'three')
    done()
  }
})

it('restricts fields to email if there is an EmailInput', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
    <Field>
      <EmailInput />
    </Field>
    </GetValidationSchema>
  )

  function assert(schema) {  
    expectPasses(schema, "daniel@example.com")
    expectFails(schema, "danielexamplecom")
    done()
  }
})

it('restricts fields to number if there is a NumberInput', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Field>
        <NumberInput />
      </Field>
    </GetValidationSchema>
  )

  function assert(schema) {  
    expectPasses(schema, "42")
    expectFails(schema, "foo")
    done()
  }
})

it('doesnt tolerate unknown fields: root', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Field name="one" validator={myValidator}/>
      <Field name="two" />
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, {})
    expectPasses(schema, {one: 'foo', two: 'bar'})
    expectFails(schema, {one: 'foo', two: 'bar', three: 'baz'})
    done()
  }
})


it('doesnt tolerate unknown fields: nested', (done) => {
  render(
    <GetValidationSchema onFinish={assert}>
      <Field name="root">
        <Field name="one" validator={myValidator}/>
        <Field name="two" />
      </Field>
    </GetValidationSchema>
  )

  function assert(schema) {
    expectPasses(schema, {root: {}})
    expectPasses(schema, {root: {one: 'foo', two: 'bar'}})
    expectFails(schema, {root: {one: 'foo', two: 'bar', three: 'baz'}})
    done()
  }
})
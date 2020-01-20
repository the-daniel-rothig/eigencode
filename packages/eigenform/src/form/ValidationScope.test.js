import React, { useContext } from 'react';
import { setLocale } from 'yup';
import 'yup-extensions';

import ValidationScopeContext from './ValidationScopeContext';
import ValidationScope from './ValidationScope';
import Field from './Field';
import { render, cleanup, wait } from '@testing-library/react';

setLocale({
  string: {
    requiredStrict: "please enter ${label}",
  }
})
const ErrorOutput = ({name='errors', values={}}) => {
  const { errors, runValidation } = useContext(ValidationScopeContext);
  runValidation(values);
  return <pre data-testid={name}>{JSON.stringify(errors, null, ' ')}</pre>
}

afterEach(cleanup);

it('makes validation available 1', () => {
  const { getByTestId } = render(
    <ValidationScope>
      <Field name='foo' />
      <ErrorOutput />
    </ValidationScope>
  )

  return wait(() => {
    expect(JSON.parse(getByTestId('errors').innerHTML)).toStrictEqual(
      [
        {
          path: 'foo',
          message: 'please enter foo'
        }
      ]
    )
  })
})

it('makes validation available 2', async () => {
  const { getByTestId } = render(
    <ValidationScope>
      <Field name='foo' />
      <ErrorOutput values={{foo: 'Daniel'}}/>
    </ValidationScope>
  )

  await new Promise(ok => setTimeout(ok, 10));
  return wait(() => {
    expect(JSON.parse(getByTestId('errors').innerHTML)).toStrictEqual(
      []
    )
  })
})

it('works wihin a field context', async () => {
  const FieldBar = ({children}) => <Field name='bar'>{children}</Field>
  const { getByTestId } = render(
    <Field name='bar'>
      <ValidationScope>
        <Field name='foo' />
        <ErrorOutput values={{bar: {foo: 'Daniel'}}}/>
      </ValidationScope>
    </Field>
  )
  await new Promise(ok => setTimeout(ok, 10));
  
  expect(getByTestId('errors').innerHTML).toBe('[]');
})

it('works when nested', async () => {
  const values = {
    inner: 'valid',
    outer: '',
  };

  const { getByText, getByTestId } = render(
    <ValidationScope>
      <ValidationScope>
        <Field name='inner' />
        <ErrorOutput name='inner' values={values}/>
      </ValidationScope>
      <Field name='outer' />
      <ErrorOutput name='outer' values={values}/>
    </ValidationScope>
  )
  
  await new Promise(ok => setTimeout(ok, 10));
  
  expect(getByTestId('inner').innerHTML).toBe('[]');
  expect(JSON.parse(getByTestId('outer').innerHTML)).toStrictEqual(
    [
      {
      "path": "outer",
      "message": "please enter outer"
      }
    ]);
})

it('enforces completeness when isComplete is set', async () => {
  const values = {foo: 'foo', bar: 'unknown'};

  const { getByText, getByTestId } = render(
    <ValidationScope isComplete>
      <Field name='foo' />
      <ErrorOutput values={values}/>
    </ValidationScope>
  )

  await new Promise(ok => setTimeout(ok, 10));
  
  expect(JSON.parse(getByTestId('errors').innerHTML)).toStrictEqual(
    [
      {
        "message": "this field cannot have keys not specified in the object shape"
      }
    ]
  )
})

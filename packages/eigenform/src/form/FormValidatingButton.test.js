import React, { useContext } from 'react';
import { render } from '@testing-library/react';
import { Form, FormContext } from '../../base';
import Field from './Field';
import FormValidatingButton from './FormValidatingButton';
import { act } from 'react-dom/test-utils';
import ValidationScopeContext from './ValidationScopeContext';
import ValidationScope from './ValidationScope';

const Feedback = () => {
  const {errors} = useContext(ValidationScopeContext);
  return <pre data-testid='feedback'>{JSON.stringify(errors)}</pre>
}

it('works', async () => {
  const { getByText, getByTestId } = render(
    <FormContext.Provider value={{values: {foo: 'foo', bar: '', baz: 'baz'}}}>
      <ValidationScope>
        <Field name='foo'/>
        <Field name='bar'/>
        <Field name='baz'/>
        <FormValidatingButton>click to validate</FormValidatingButton> 
        <Feedback />
      </ValidationScope>
    </FormContext.Provider>    
  )

  expect(getByTestId('feedback').innerHTML).toBe('');

  act(() => getByText('click to validate').click())

  await new Promise(ok => setTimeout(ok, 5));

  expect(JSON.parse(getByTestId('feedback').innerHTML)).toStrictEqual([
    {
      path: "bar",
      message: "please enter bar"
    }
  ])
})

it('can render a custom component', async () => {
  const { getByText, getByTestId } = render (
    <FormContext.Provider value={{values: {foo: 'foo', bar: '', baz: 'baz'}}}>
      <ValidationScope>
        <Field name='foo'/>
        <Field name='bar'/>
        <Field name='baz'/>
        <FormValidatingButton>
          {onClick => <a href="#" onClick={onClick}>click me!</a>}  
        </FormValidatingButton> 
        <Feedback />
      </ValidationScope>
    </FormContext.Provider> 
  ) 

  expect(getByText('click me!').tagName).toBe('A');

  expect(getByTestId('feedback').innerHTML).toBe('');

  act(() => getByText('click me!').click())

  await new Promise(ok => setTimeout(ok, 5));

  expect(JSON.parse(getByTestId('feedback').innerHTML)).toStrictEqual([
    {
      path: "bar",
      message: "please enter bar"
    }
  ])
})
import React from 'react';
import { render } from '@testing-library/react';
import FieldFeedback from './FieldFeedback';
import ValidationScope from './ValidationScope';
import Field from './Field';
import Form from './Form';
import FormValidatingButton from './FormValidatingButton';

const setup = renderProp => render(
  <Form>
    <Field name='foo'>
      <FieldFeedback render={renderProp}/>
    </Field>
    <FormValidatingButton>click me</FormValidatingButton>
  </Form>
)

it('writes error messages in sentence-case', async () => {
  const { getByText } = setup('click me');

  getByText('click me').click()
  await new Promise(ok => setTimeout(ok, 5));

  const element = getByText('Please enter foo');

  expect(element.tagName).toBe('SPAN');
  expect(element.className).toBe('field-feedback');
})

it('can take a render prop', async () => {
  const { getByText } = setup(message => <div className='styled-error-message'>{message}!!!</div>);

  getByText('click me').click();
  await new Promise(ok => setTimeout(ok, 5));

  const element = getByText('Please enter foo!!!');

  expect(element.tagName).toBe('DIV');
  expect(element.className).toBe('styled-error-message');
})
import React from 'react';
import { render, wait } from '@testing-library/react';
import FieldFeedback from './FieldFeedback';
import Field from './Field';
import Form from './Form';

const setup = () => render(
  <Form>
    <Field name='foo'>
      <FieldFeedback />
    </Field>
  </Form>
)

it('writes error messages in sentence-case', async () => {
  const { getByText } = setup();

  await wait(() => {
    const element = getByText('Please enter foo');

    expect(element.tagName).toBe('SPAN');
    expect(element.className).toBe('field-feedback');
  })
})

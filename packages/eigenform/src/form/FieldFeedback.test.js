import React from 'react';
import { render, wait } from '@testing-library/react';
import FieldFeedback from './FieldFeedback';
import Field from './Field';
import Form from './Form';

const setup = renderProp => render(
  <Form>
    <Field name='foo'>
      <FieldFeedback render={renderProp}/>
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

it('can take a render prop', async () => {
  const { getByText } = setup(message => <div className='styled-error-message'>{message}!!!</div>);

  await wait(() => {
    const element = getByText('Please enter foo!!!');

    expect(element.tagName).toBe('DIV');
    expect(element.className).toBe('styled-error-message');
  })
})
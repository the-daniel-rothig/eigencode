import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TextInput, Form, Label, FieldFeedback, Field } from '../../styled';


it('has a weird bug', async () => {
  var hitCount = 0
  const Probe = () => {
    hitCount+=1;
    return null;
  }

  const { getByLabelText } = render(
    <Form>
      <Probe />
      <Field name='one'>
        <Label>one</Label>
        <TextInput />
        <FieldFeedback />
      </Field>

      <Field name='two'>
        <Probe />
        <Label>two</Label>
        <TextInput />
      </Field>
    </Form>
  );
  
  expect(hitCount).toBe(2);
  
  const input = getByLabelText('two');

  fireEvent.change(input, { target: { value: 'after' }} );

  await new Promise(ok => setTimeout(ok,500));
  expect(hitCount).toBe(2)
})
import React from 'react';
import './App.css';
import Form from './form/Form';
import TextInput from './form/TextInput';
import Label from './form/Label';
import Field from './styled/Field';
import Radio from './form/Radio';
import Conditional from './styled/Conditional';
import { string } from 'yup';

import './yup/extensions';
import Multiple from './styled/Multiple';

function App() {
  return (
    <div className="App">
      <Form>
        <Field name='firstName' validator={string().required()}>
          <Label>First name</Label>
          <TextInput />
        </Field>
        <Field name='lastName' validator={string().required()}>
          <Label>Last name</Label>
          <TextInput />
        </Field>
        <Field name='hasMiddleName'>
          <Label>Do you have a middle name?</Label>
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Field>
        <Conditional
          when='hasMiddleName'
          is='yes'
        >
          <Field name='middleName' validator={string().required()}>
            <Label>Please tell us your middle name</Label>
            <TextInput />
          </Field>
        </Conditional>
        <Field name='age' validator={string().numeric()}>
          <Label>How old are you?</Label>
          <TextInput />
        </Field>

        <Field name='likesAnimals'>
          <Label>Do you like animals?</Label>
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Field>
        <Conditional when='likesAnimals' is='yes'>
          <Multiple name='animals'>
            <Field name='animal'>
              <Label>Enter an animal name</Label>
              <TextInput />
            </Field>
            <Field name='love'>
              <Label>How much do you love this?</Label>
              <TextInput />
            </Field>
          </Multiple>
        </Conditional>

      </Form>
    </div>
  );
}

export default App;

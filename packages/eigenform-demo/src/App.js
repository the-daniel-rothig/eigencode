import React, { useContext } from 'react';
import './App.css';

import 'yup-extensions';

/* eslint-disable no-unused-vars */
import {
  Button,
  Checkbox,
  Conditional,
  EmailInput,
  Field,
  Form,
  FieldContext,
  FieldFeedback,
  FormContext,
  InputBase,
  Label,
  Multiple,
  NumberInput,
  Radio,
  Select,
  TextInput,
  YesNo,
 } from 'eigenform/styled'
/* eslint-enable */

const Debug = () => {
  const { getValue } = useContext(FormContext);
  return (<pre>{JSON.stringify(getValue(""), null, '  ')}</pre>)
}

const ExampleForm = () => (
      <Form>
        <Field name='your first name'>
          <Label>First name</Label>
          <TextInput />
          <FieldFeedback />
        </Field>
        <Field name='your last name'>
          <Label>Last name</Label>
          <TextInput />
          <FieldFeedback />
        </Field>
        <Field name='whether you have a middle name'>
          <Label>Do you have a middle name?</Label>
          <YesNo />
          <FieldFeedback />
        </Field>
        <Conditional
          when='youHaveAMiddleName'
          is='yes'
        >
          <Field name='your middle name'>
            <Label>Please tell us your middle name</Label>
            <TextInput />
            <FieldFeedback />
          </Field>
        </Conditional>
        <Field name='your age'>
          <Label>How old are you?</Label>
          <NumberInput />
          <FieldFeedback />
        </Field>
        <Field name='the ice cream flavours'>
          <Label>What are your favourite ice cream flavours?</Label>
          <Checkbox value='vanilla'>Vanilla</Checkbox>
          <Checkbox value='chocolate'>Chocolate</Checkbox>
          <Checkbox value='strawberry'>Strawberry</Checkbox>
          <FieldFeedback />
        </Field>

        <Field name='whether you like animals'>
          <Label>Do you like animals?</Label>
          <YesNo />
          <FieldFeedback />
        </Field>
        <Conditional when='youLikeAnimals' is='yes'>
          <Multiple name='animals'>
            <Field name="the animal's name">
              <Label>Enter an animal name</Label>
              <TextInput />
              <FieldFeedback />
            </Field>
            <Conditional when={['$firstName', 'animal']} is={(firstName, animal) => !!firstName && firstName === animal}>
              Hey, that's you!
            </Conditional>
            <Field name='your love for the animal'>
              <Label>How much do you love this?</Label>
              <TextInput />
              <FieldFeedback />
            </Field>
            <Field name='whether you have a pet'>
              <Label>Do you have one as a pet?</Label>
              <YesNo />
              <FieldFeedback />
            </Field>
            <Conditional when='youHaveAPet' is='yes'>
              <Field name='the name of your pet'>
                <Label>What's the name of your pet?</Label>
                <TextInput />
                <FieldFeedback />
              </Field>
            </Conditional>
          </Multiple>
        </Conditional>
        <Debug />
      </Form>
)

function App() {
  // const valSchema = getValidationSchema(
  //   <ExampleForm />
  // );
  // debugger;
  return (
    <div className="App">
      <ExampleForm />
    </div>
  );
}

export default App;

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
        <Field label='your first name'>
          <Label>First name</Label>
          <TextInput />
          <FieldFeedback />
        </Field>
        <Field label='your last name'>
          <Label>Last name</Label>
          <TextInput />
          <FieldFeedback />
        </Field>
        <Field label='whether you have a middle name'>
          <Label>Do you have a middle name?</Label>
          <YesNo />
          <FieldFeedback />
        </Field>
        <Conditional
          when='whetherYouHaveAMiddleName'
          is='yes'
        >
          <Field label='your middle name'>
            <Label>Please tell us your middle name</Label>
            <TextInput />
            <FieldFeedback />
          </Field>
        </Conditional> 
        <Field label='your age'>
          <Label>How old are you?</Label>
          <NumberInput />
          <FieldFeedback />
        </Field>
        <Field label='the ice cream flavours'>
          <Label>What are your favourite ice cream flavours?</Label>
          <Checkbox value='vanilla'>Vanilla</Checkbox>
          <Conditional includes='vanilla'>
            <Field embedded label='if you like it with chocolate chips'>
              <Label>Oooh, with chocolate chips?</Label>
              <YesNo />
              <FieldFeedback />
            </Field>
          </Conditional>
          <Checkbox value='chocolate'>Chocolate</Checkbox>
          <Checkbox value='strawberry'>Strawberry</Checkbox>
          <FieldFeedback />
        </Field>

        <Field label='whether you like animals'>
          <Label>Do you like animals?</Label>
          <YesNo />
          <FieldFeedback />
        </Field>
        <Conditional when='whetherYouLikeAnimals' is='yes'>
          <Multiple name='animals' max={4}>
            <Field label="the animal's name" validator={s => s.unique()}>
              <Label>Enter an animal name</Label>
              <TextInput />
              <FieldFeedback />
            </Field>
            <Field label='your love for the animal'>
              <Label>How much do you love this?</Label>
              <TextInput />
              <FieldFeedback />
            </Field>
            <Field label='whether you have a pet'>
              <Label>Do you have one as a pet?</Label>
              <YesNo />
              <FieldFeedback />
            </Field>
            <Conditional when='whetherYouHaveAPet' is='yes'>
              <Field label='the name of your pet'>
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
  return (
    <div className="App">
      <ExampleForm />
    </div>
  );
}

export default App;

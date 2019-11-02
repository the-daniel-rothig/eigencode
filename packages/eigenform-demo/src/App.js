import React, { useContext } from 'react';
import './App.css';
import { string, number } from 'yup';

import 'yup-extensions';

import {
  Button,
  Checkbox,
  Conditional,
  EmailInput,
  Field,
  Form,
  FieldContext,
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

const Debug = () => {
  const { values } = useContext(FormContext);
  return (<pre>{JSON.stringify(values, null, '  ')}</pre>)
}

const ExampleForm = () => (
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
          <YesNo />
          {/* <Radio value='yes'>Yes</Radio>
          <Radio value='no'>No</Radio> */}
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
        <Field name='age' validator={number()}>
          <Label>How old are you?</Label>
          <TextInput />
        </Field>
        <Field name='iceCreamFlavours'>
          <Label>What are your favourite ice cream flavours?</Label>
          <Checkbox value='vanilla'>Vanilla</Checkbox>
          <Checkbox value='chocolate'>Chocolate</Checkbox>
          <Checkbox value='strawberry'>Strawberry</Checkbox>
        </Field>

        <Field name='likesAnimals'>
          <Label>Do you like animals?</Label>
          <YesNo />
        </Field>
        <Conditional when='likesAnimals' is='yes'>
          <Multiple name='animals'>
            <Field name='animal' validator={string().required()}>
              <Label>Enter an animal name</Label>
              <TextInput />
            </Field>
            <Conditional when={['$firstName', 'animal']} is={(firstName, animal) => !!firstName && firstName === animal}>
              Hey, that's you!
            </Conditional>
            <Field name='love' validator={string().required()}>
              <Label>How much do you love this?</Label>
              <TextInput />
            </Field>
            <Field name='hasPet'>
              <Label>Do you have one as a pet?</Label>
              <YesNo />
            </Field>
            <Conditional when='hasPet' is='yes'>
              <Field name='pet' validator={string().required()}>
                <Label>What's the name of your pet?</Label>
                <TextInput />
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

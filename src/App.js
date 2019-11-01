import React, { useContext } from 'react';
import './App.css';
import Form from './form/Form';
import TextInput from './form/TextInput';
import Label from './form/Label';
import Field from './styled/Field';
import Radio from './styled/Radio';
import Conditional from './styled/Conditional';
import { string } from 'yup';

import './yup/extensions';
import Multiple from './styled/Multiple';
import YesNo from './styled/YesNo';
import Checkbox from './styled/Checkbox';
import FormContext from './form/FormContext';

const Debug = () => {
  const { values } = useContext(FormContext);

  // const shape = {};
  // inputs.filter(i => i.validator).map(i => ({
  //   validator: i.validator,
  //   path: i.name.replace(/\[[0-9]+\]/g, "[]").split(".").filter(Boolean)
  // })).forEach(({validator, path}) => {
  //   let target = shape;
  //   path.slice(0, -1).forEach(p => {
  //     target[p] = target[p] || {};
  //     target = target[p];
  //   })
  //   target[path[path.length -1]] = validator;
  // })

  // const toSchema = obj => {
  //   if (obj.__isYupSchema__) {
  //     return obj;
  //   }
  //   const s = {}
  //   Object.keys(obj).forEach(key => {
  //     if (key.endsWith("[]")) {
  //       s[key.slice(0, -2)] = array().of(toSchema(obj[key]));
  //     } else {
  //       s[key] = toSchema(obj[key])
  //     }
  //   })

  //   return object().shape(s)
  // }

  // const validationSchema = toSchema(shape);

  let message = 'ok';

  // try {
  //   validationSchema.validateSync(values, {context: values});
  // } catch(e) {
  //   message = e.message
  // }

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

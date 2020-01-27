# eigenform

An advanced, high-performance form system built for exensibility and seamless integration into your design systems.

Features:

- Nested objects
- Client-side and server-side validation
- Conditionally rendered sections
- Repeated sections

**This Readme is currently under construction - check back later, or read on for a taster of the API**  

## Example

```javascript
import { Form, Field, Label, TextInput, Conditional, Multiple } from 'eigenform';

<Form>
  <Field name="fullName" label="your name">
    <Label>Full name:</Label>
    <TextInput max={30} min={2} />
  </Field>

  <Field name="age" optional label="your age">
    <Label>Your age (optional):</Label>
    <NumberInput />
  </Field>

  <Field name="hasNickname" omit label="you have a nickname">
    <Label>Do you have a nickname?</Label>
    <YesNoInput />
  </Field>

  <Conditional when="hasNickname" is={true}>
    <Field name="nickname" label="your nickname">
      <Label>Your nickname:</Label>
      <TextInput max={30} />
    </Field>
  </Conditional>

  <h3>Which countries are you a citzen of?</h3>
  <Multiple name="countries" min={1} max={5}>
    <Label>Enter a country name ({Multiple.ordinal} of {Multiple.total})</Label>
    <TextInput />
  </Multiple>

  <Button onClick={Form.submit} />
</Form>
```

## Concepts

### Forms and Fields

`<Fields />` are the fundamental unit of data in your forms: Every `<Field />` element corresponds to a value in your data model, and is the entity that can have validation tests against it. 

The `<Form />` element wraps around your fields to build up your over-all data model, orchestrates top-level validation and provides the means to submit your form. 

### Inputs

Eigenform provides several controls to be rendered inside your form for data entry. Collectively called Input components, these are located inside `<Field />` components to update the value of that field. The Input components available out of the box are:

- TextInput
- NumberInput
- EmailInput
- Radio
- Checkbox
- Select

But of course you can add your own.

### Groups

Groups allow you to define nested data structures and instrument sets of `<Field />`s for re-use.

### Conditionals

Fields and options that should only be shown when certain conditions on the form data are met can be controlled with `<Conditional />` components.

### Multiples

To let the form accept multiple answers for a field or set of fields, wrap them in a `<Multiple />` component that will offer users to "Add another" group of answers.

### Validation

The props of `<Field />`s and their contained inputs are used to build up a validation schema that generates feedback messages if validation requirements are not met. You can extend or replace the validation behaviour by setting a `validator` prop on `<Field />`, and set the messaging by setting a `label` on `<Field />`
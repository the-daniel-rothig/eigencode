# react-context-filter

Allows your React components to subscribe to just part of a context, allowing you to eliminate unnecessary re-renders and build high-performance user interfaces.

```bash
npm install react-context-filter
```

Part of the [eigencode](../..) project.

## Background

The React context API allows components to subscribe to the state of their surroundings. In theory, this leads to greater decoupling between providers and consumers of state, improving reusability; however, context providers need to decide how much their consumers want to know: every time any aspect of a context changes, all subscribers must update. If the context entity is composed of many changing parts, it can cause a large number of frequent re-renders.

The usual advice is to split your contexts into smaller units, so that consumers can cherry-pick what they are interested in. But the choice of granularity is difficult because it forces us to predict how consumer components want to use the context, leading to implicit coupling between the provider and consumer logic. Distributing state over multiple context objects can also diffuse domain concepts and make code harder to read.

**react-context-filter** solves this by allowing context consumers to specify what parts of a context they want to subscribe to. This enables you to define your contexts by domain logic, rather than performance considerations.

## ContextFilter

Imagine you are building a form and have access to a `FormContext` - a complex entity with getters and setters for all field values. It updates every time anything in the form changes, but typically subscribes are only interested in changes of "their" field. We would like to expose a `FieldContext` that has the value, callbacks and metadata of a single field, so that elements like inputs only have to re-render when "their" value changes.

```javascript
import { ContextFilter } from 'react-context-filter';
import FormContext from './FormContext';

export const FieldContext = React.createContext()

// This component acts as a provider of FieldContext, which
// holds a value derived from the `FormContext` value
export const Field = ({name, children}) => {

  // this function takes the value(s) of the source context(s)
  // and returns a value for the target context
  const map = formContext => ({
    fieldValue: formContext.get(name),
    setFieldValue: value => formContext.set(name, value),
    fieldName: name,
  });

  // this function evaluates whether the new return value from "map"
  // is different from the previous one, i.e. if a re-render should be
  // triggered. By default, this is previous === next.
  const isUnchanged = (previous, next) => {
    return previous.fieldName === next.fieldName &&
            previous.fieldValue === next.fieldValue;
  };

  return (
    <ContextFilter
      of={FormContext}
      to={FieldContext}
      map={map}
      isUnchanged={isUnchanged}
    >
      {children}
    </ContextFilter>
  );
}
```

The child components of `Field` will have access to a FieldContext that only updates when that specific field updates. It is used like any other context: 

```javascript
const Label = ({children}) => {
  const { fieldName } = useContext(FieldContext);
  return <label for={fieldName}>{children}</label>
}

const TextInput = () => {
  const { fieldValue, fieldName, setFieldValue } = useContext(FieldContext);
  const onChange = e => setFieldValue(e.target.value);
  return (
    <input type="text" value={fieldValue} name={fieldName} onChange={onChange} />
  );
}
```

this can now be used as follows:

```javascript
<Field name="firstName">
  <Label>Enter your first name</Label>
  <TextInput />
</Field>

<Field name="lastName">
  <Label>Enter your last name</Label>
  <TextInput />
</Field>
```

The first block will get re-rendered when the "firstName" value changes, but is unaffected by "lastName"; for the second block, it's the other way around. This way, we have halved the number of elements that need re-rendering on a key stroke; for more complex forms, the performance gains increase linearly.

**Note**: If you want to build a form using ContextFilter, consider using [eigenform](./../eigenform) as a base. It takes full advantage of ContextFilter and has an API very similar to the one described above. 

### ContextFilter API

`ContextFilter` is a React component with the following props:

| Name      | Required    | Default   | Description
|-----------|-------------|-----------|-------------------------------------------------------------------------
| of        | yes         | -         | A React context type, or an array of React context types. These are the source context types
| to        | yes/no      | same as "of" if "of" is a single type; otherwise it's required | A React context type. This is the target type which should be exposed by ContextFilter
| map       | yes         | -         | A function that maps the value(s) of the source context(s) into the value of the target context. The callback has as many arguments as source context types have been specified: the first argument is the value of the first context, the second argument is the value of the second context, and so forth.
| isUnchanged | no        | reference equality | A function with two aruguments (previous, next) to determine if the context has changed; if a falsey value is returned, components subscribing to the target context are re-rendered. 

## withFilteredContext

It's not always useful to introduce a new context type every time you want to filter a context. In the above example, `Label` gets re-rendered every time the field **value** changes, even though it doesn't depend on the value. To address this, we could introduce an even narrower context:

```javascript
  // Step 1: introduce a new context type, just for labels
  const LabelContext = React.createContext();

  // Step 2: use ContextFilter to exponse just the `fieldName`
  const LabelContextProvider = ({children}) => (
    <ContextFilter
      of={FieldContext}
      to={LabelContext}
      map={fieldContext => fieldContext.fieldName}
    >
      {children}
    </ContextFilter>
  )

  // Step 3: implement a consumer of this narrower context
  const LabelInner = ({children}) => {
    const fieldName = useContext(LabelContext);
    return <label for={fieldName}>{children}</label>
  }

  // Step 4: tie it all together
  const Label = ({children}) => (
    <LabelContextProvider>
      <LabelInner>{children}</Label>
    </LabelContextProvider>
  );
```

That works but is very verbose! Instead, we can use the `withFilteredContext` Higher-Order Component, which injects a filtered context value as a prop and ensures the wrapped component only re-renders when the value changes (or when `isUnchanged` returns `false`). Here is what the above example looks like using `withFilteredContext`:

```javascript
import { withFilteredContext } from 'react-context-filter';

const Label = withFilteredContext({
  of: FieldContext,
  map: fieldContext => ({ name: fieldContext.fieldName })
})(
  ({name, children}) => (
    <label for={name}>{children}</label>
  )
)
```

The mapping function returns an object that gets merged into the props of the wrapped component. This pattern is preferable for "one-off" ContextFilters, ie. where there is only one component interested in that particualar context mapping.

By default, the fields of the object are compared for reference eqality across context changes (aka. shallow comparison) - you can override this behaviour by passing a custom `isUnchanged` option:

```javascript
const Label = withFilteredContext({
  of: FieldContext,
  map: fieldContext => ({ name: fieldContext.fieldName }),
  isUnchanged: (previous, next) => !!previous.name && !!next.name && previous.name === next.name
})( /* ... etc ... */ )
```

The options of `withFilteredContext` can also be a function of the component props. For example:

```javascript
const FieldValueDisplay = withFilteredContext(props => ({
  of: FormContext,
  map: formContext => ({ value: formContext.get(props.name) })
}))(
  ({value}) => <span>{value}</span> 
);
```

This parameterises the mapping function with the component props, so that the above component can be used like this:

```javascript
<Field name="firstName">
  <Label>What is your first name?</Label>
  <TextInput />
</Field>

<Field name="age">
  <Label>How old are you, <FieldValueDisplay name="firstName" />?</Label>
  <TextInput />
</Label>
```

<details>
  <summary>Aside: why not use Hooks?</summary>

  React lets you subscribe to contexts via the hooks API, which begs the question why we can't do something like:

  ```javascript
  const Label = ({children}) => {
    const filteredContext = useFilteredContext({
      of: FieldContext
      map: fieldContext => ({ fieldName })
    });

    return <label for={filteredContext.fieldName}>{children}</label>
  };
  ```

  This would be more aligned with React's `useContext()` API and make using multiple filtered contexts cleaner. Unfortunately the Hooks API doesn't provide a means to bail out of a re-rendering the component - at least at the moment - so for now we are restricted to use Higher-Order Components.

  However, since you can consume multiple source contexts with a single `withFilteredContext()` HOC, the need to chain multiple calls of `withFilteredContext()` together should be pretty rare. 

</details>

### withFilteredContext API

`withFilteredContext(options)(Component)`

`options` is either an object with the entries as specified in the table below, or it is a function that returns an `options` object. If it is a function, it will get called with the component props as its single argument.

| Name      | Required    | Default   | Description
|-----------|-------------|-----------|-------------------------------------------------------------------------
| of        | yes         | -         | A React context type, or an array of React context types. These are the source context types - same as the `ContextFilter` prop
| to        | no          | -         | Target context type. If none is specified, an anonymous context type is used, and only the wrapped component has access to the value. If it is specified, children components can access the value using `React.useContext()`.
| map       | yes         | -         | A function that maps the value(s) of the source context(s) into wrapped component props. It has one argument per context type specified in the `of` option. The return value must be an object (or `null`): its fields will be spread into the components' props. 
| isUnchanged | no        | shallow reference equality | A function with two aruguments (previous, next) to determine if the context has changed - same as the `ContextFilter` prop

`Component` is any React component. It will receive props as per the rules above.

## Tips and tricks

### Setting the target context to equal the source context

You can use ContextFilter as a shim to optimise legacy codebases. For example, if you have `TextInput` components that subscribe to a large `FormContext`, even though they only need a single field value, you could wrap them in a ContextFilter without `to` prop and pass a custom `isUnchanged` prop to tweak the rendering logic of content children.

### Beware of state changes causing global update cascades

Of course all context tweaking is useless if state changes cause the whole application tree to be re-evaluated. Consider this application component:

```javascript
const MyApp = () => {
  const [state, setState] = useState({});
  return (
    <FormContext.Provider value={{state, setState}}>
      <Field name="firstName">
        <TextInput />
      </Field>
      <Field name="lastName">
        <TextInput />
      </Field>
    </FormContext.Provider>
  )
}
```

This component re-creates elements representing the entire form every time the state changes - which is every time anything in the form changes! To ensure re-renders are driven by context updates, rather than cascading globally from the state change, you need to memoize the React elements that represent the contents of the `Context.Provider`:

```javascript
const MyApp = () => {
  const [state, setState] = useState({});
  const contents = useMemo(() => (
    <>
      <Field name="firstName">
        <TextInput />
      </Field>
      <Field name="lastName">
        <TextInput />
      </Field>
    </>
  ), []);

  return (
    <FormContext.Provider value={{state, setState}}>
      {contents}
    </FormContext.Provider>
  )
}
```

React has a special rule that states if the children prop of a `Context.Provider` retains **reference equality** across re-renders, the update cascade is stopped - which is often what you want.

### Beware of render function props 

If an update in React causes a render function to be re-evaluated, everything within that function will be re-rendered. From a performance point of view, rendering context providers within a render prop is not beneficial. (Still, sometimes it can lead to cleaner code.)

As a general rule, optimizing context within a render prop is only useful if the context gets updated much more frequently than the render prop arguments.

Avoid frequently updating render functions rendering large component trees (e.g. an entire form).

### Don't over-optimize

While `ContextFilter` ensures that its children only get re-rendered when they have to, the `map` function (and the `isUnchanged` function, if specified) will be executed every time any of the source contexts change. This is only sensible if these functions are fast compared to a re-render, so ensure that they don't contain expensive computations - defer those to the render cycles of the contained components.


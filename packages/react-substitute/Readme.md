# react-substitute

Allows you to modify, or completely replace, React elements when they are rendered.

```bash
npm install react-substitute
```

Part of the [eigencode](https://github.com/the-daniel-rothig/eigencode#readme) project.

## Element substitution

There are many situations where element substitution comes in handy:

* replacing `<input>` elements with read-only `<span>`s
* adding logging and analytics to interactive elements
* add additional functionality, such as internationalisation, to legacy components or shared components that you can not directly modify.
* adding admin buttons into an UI normally used by non-admin users

For example, the following implementation substitutes `<input>` HTML elements with `<FancyInput>` components:

```javascript
  import React from 'react';
  import Substitute from 'react-substitute'
  import { FancyInput } from './myComponents'

  const mapInputToFancy = ({element}) => {
    if (element && element.type === "input") {
      // the current element is a HTML "input" - return a replacement,
      // copying the elements props (which will include any children)
      // as well as ref and key, if they are set.
      return <FancyInput {...element.props} ref={element.ref} key={element.key} />
    }

    // otherwise, just render the original element
    return element;
  }

  const MyForm = () => (
    <form>
      <input type="text" name="firstName" />
      <input type="text" name="lastName" />
    </ form>
  )

  const FancyForm = () => (
    <Substitute mapElement={mapInputToFancy}>
      <MyForm />
    </Substitute>
  )
```

In the above example, `FancyForm` will be equivalent to:

```javascript
  <form>
    <FancyInput type="text" name="firstName" />
    <FancyInput type="text" name="lastName" />
  </form>
```

In this way, we managed to augment the functionality of `<MyForm>` without changing its implementation.

### mapElement signature

the `mapElement` prop accepts a function that gets invoked just before an element is about to be rendered by React. It gets passed an options object as its single argument with the following entries:

| Name           | Type               | Description
|----------------|--------------------|-------------
| element        | mixed              | Describes the current node in the component tree. Can be `null` or `undefined`. For text and numerical nodes, it is of type "string" or "number", for everything else, it is a React element object, ie. the return value of `React.createElement()`. The most useful entries are:
| element.props  | object             | The props passed to the react element, including `children`
| element.type   | string or function | for HTML elements, this is a string, e.g. `div`; otherwise it's the component class / function
| element.key    | string             | The "key" property of the element, if it's set
| element.ref    | string             | The "ref" property of the element, if it's set
| getContext     | function           | allows you to access a context value, as seen by the current element: `const context = getContext(MyContext)`
| memo           | mixed              | the `memo` that was optionally returned by the parent's invocation of `mapElement`
| siblingIndex   | number            | the index this element has among its siblings
| siblingCount   | number            | the total number of siblings that includes this element

`mapElement`'s return value should be:

**EITHER**: a new react element to be rendered instead of `element` - can also be a string/number value, or `null`.

**OR**: an array where the first entry is the element to be rendered (as above), and the second entry is a memo to be passed on to children as the value of `memo` when `mapElement` is called for them. This is for advanced use-cases where you need to pass contextual information to determine the correct element to be rendered.

<details>
  <summary>The third array entry</summary>

  When implementing `mapElement` to return an array, you can return a third object containing callbacks to be executed at different parts of the render process. 
  
  Currently, only one callback is supported: `onChildrenArrayResolved`, which is executed after the component's render function returns. It is passed the array of elements returned by the component.

  ```javascript
  function mapElement({element, memo}) => {
    return [element, memo, {
      onChildrenArraResolved: (childArray) => {
        console.log(`${element.type.name} contains ${childArray.length} entries`)
      }
    }]
  }
  ```

  More event hooks may added in the future.
</details>

## Tips and tricks

### Don't overuse

**react-substitute** essentially adds aspect-oriented programming to React: You can decorate your components by wrapping them in a `<Substitute>` which can alter component behaviour; and like aspect-oriented programming, it can lead to "magical" code that behaves differently to how it reads. It's important to use substitutes in a way that supplement, rather than contradict, the behaviour described by the component code.

A good rule of thumb is no avoid using **react-substitute** to implement the primary purpose of your component - it's best used for things the component would consider "side effects", such as:

- logging
- analytics
- access control management (e.g. hide actions the user is not authorized to do)
- theming
- translation and internationalisation

But you usually want to avoid using **react-substitute** for:

- state binding
- modifying internal component logic

That said, **react-substitute** is capable of altering component behaviour in a wide variety of ways. For example, [react-custom-renderer](../react-custom-renderer) uses `<Substitute>`s to build fully custom render engines on top of React.

### Use `mapElement` as a hook

Sometimes, you don't need to replace the rendered element at all to accomplish the desired effect - it may be sufficient to do things as a side effect within `mapElement`. For example, if you want to log a message to the console every time a `<button>` is rendered, rather than replacing the button:

```javascript
const LoggingButton = React.forwardRef(
  (props, ref) => {
    useEffect(() => {
      console.log('A button was rendered')
    }, []);

    return <button {...props} ref={ref} />
  }
);

function mapElement({element}) {
  if (element && element.type === "button") {
    return <LoggingButton {...element.props} key={element.key} ref={element.ref} />
  }

  return element;
}
```

You could just do the logging within `mapElement`:

```javascript
function mapElement({element}) {
  if (element && element.type === "button") {
    console.log('A button was rendered')
  }

  return element;
}
```

But beware: `mapElement` will be run every time a new element is rendered, and should only contain trivial mapping operations or side effects that run quickly.

### Use multiple, simple `<Substitute>`s to compose behaviour

The `<Substitute>` component can be used anywhere in the component tree, and can even be nested. This allows you to use multiple `<Substitute>`s in your app, without issues or performance penalties. Doing so will let you write one `mapElement` per aspect, increasing reusability and improving code quality.
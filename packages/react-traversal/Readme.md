# react-traversal

Write custom renderers for React components to reuse them in a wider range of situations, and inject custom rendering behaviour into React.

## Example

react-traversal ships with a simple example renderer `extractText`, which renders a component in plain text.

```javascript
import React from 'react';
import { extractText, traverseDepthFirst } from 'react-traversal';

const Layout = ({children}) => (
  <>
    <div>Welcome to my blog</div>
    {children}
    <div>Copyright {new Date().getFullYear()}</div>
  </>
);

const App = () => (
  <Layout>
    <div>No posts currently</div>
  </Layout>
);

// render the result:
const result = traverseDepthFirst(
  <App />,
  extractText
);

console.log(result);
```

The value of `result` will read:

```
  Welcome to my blog
  No posts currently
  Copyright 2020
```

## Background

When writing a React app, you are probably planning to use it to render some HTML in a browser and define interactivity through javascript callbacks. If you write your components cleanly, you can also render a static version of your App server-side to improve load-times. 

The server-side `react-dom/server` and the client-side `react-dom` are examples of renderers - both use the same input (your react component tree) but generate different outputs (a text stream of HTML for the former; a sequence of direct DOM manipulations for the latter). They re-interpret the intent expressed in the component tree for different circumstances. 

Some components are interoperable between React and React Native, adding native UI to the mix of possible rendering targets. All of these have in common that they use React's Fiber system to build up and traverse an element tree from your component declarations.

**react-traversal** gives you the ability to write your own renderers: Maybe you want to render your UI straight into a PDF? Maybe you want to turn the structure of your web form into a SQL Database schema definition? Or maybe you want to write components that correspond to layers in an image manpulation program, building a code-based GIMP? Or maybe you just want to remove code duplication by deriving a read-only view of a form. You could also build a linter for your application component tree.

There is a range of possible applications of custom renderers that span web user interfaces, server-side functionality, and dev tooling.

## ReducerFunction

The ReducerFunction class specifies the rules of traversal for the custom renderer. This section describes how to write a renderer, while the section below discusses how to use one. 

A renderer is an instance of the ReducerFunction class, which is constructed as follows

```javascript
const myRenderer = new ReducerFunction({
  reduce,
  finalTransform,
  getContents,
  shouldUpdate,
  suppressWarnings
});
```

The options accepted by `ReducerFunction` are as follows:

### opts.reduce

**reduce(parameters)** is the most important function of the render process: it gets invoked for every element traversed in the component tree, and is expected to return the value corresponding to this component. It is passed a parameters object with the following entries:

| Name           | Type               | Description
|----------------|--------------------|-------------
| element        | mixed              | Describes the current node in the component tree. Can be `null` or `undefined`. For text and numerical nodes, it is of type "string" or "number", for everything else, it is a React element object, ie. the return value of `React.createElement()`. The most useful entries are:
| element.props  | object             | The props passed to the react element, including `children`
| element.type   | string or function | for HTML elements, this is a string, e.g. `div`; otherwise it's the component class / function
| element.key    | string             | The "key" property of the element, if it's set
| element.ref    | string             | The "ref" property of the element, if it's set
| unbox          | function           | a function to access the values returned by the elements' children. It accepts a callback mapping the array of children values to the return value for the current element. It's return value is a symbol acting as a promise for the resulting value once the children are evaulated, and should be returned by `reduce`. For example, a simple text extractor might write: `return unbox(childValues => childValues.join(" "))`.
| getContext     | function           | allows you to access a context value, as seen by the current element: `const context = getContext(MyContext)`
| isRoot         | boolean            | true when the current element is the top-level element passed into the render function
| isLeaf         | boolean            | true when the current element is not a react element, but a "string" or "number" primitive

### opts.finalTransform (optional)

This is invoked just before the result from the top-level `reduce` function is handed to the calling code. Its single argument is an array of top-level values from the component tree - unless your reduce function explicitly returns multiple values, this array will only have one entry. This gives you a chance to clean up the data for the client, e.g. remove metadata or extract the single element from the array.

```javascript
function finalTransform(arrayOfValues) {
  return arrayOfValues[0].toString();
}
```

### opts.getContents (optional)

Sometimes you want for your renderers to traverse the contents of a component, even if that component would actually hide its contents in normal execution. An example would be a `<Route>` in a react-router `<Switch>`: Normally only one route is shown at any point, but what if you want to write a renderer that extract text from all routes? In these cases, you can declare what the contents of the component are in its "expanded" state:

```javascript
import { Route } from 'react-router-dom';

function getContents({element, defaultReturn}) {
  if (element && element.type === Route) {
    // always evaluate the children, even if they are not currently active
    return element.props.children;
  }

  // defaultReturn is a symbol signifying that the render
  // should access the elements by normal evaluation
  return defaultReturn;
}
```

**IMPORTANT:** getContents is only used in static rendering; dynamic rendering is coupled tightly to what gets rendered into React's virtual DOM, so will always traverse exactly what gets rendered - no more, no less.

As the above example shows, `getContents` is passed an options object with the following entries

| Name           | Type               | Description
|----------------|--------------------|-------------
| element        | mixed              | Describes the current node in the component tree. Can be `null` or `undefined`. For text and numerical nodes, it is of type "string" or "number", for everything else, it is a React element object, ie. the return value of `React.createElement()`. The most useful entries are:
| element.props  | object             | The props passed to the react element, including `children`
| element.type   | string or function | for HTML elements, this is a string, e.g. `div`; otherwise it's the component class / function
| element.key    | string             | The "key" property of the element, if it's set
| element.ref    | string             | The "ref" property of the element, if it's set
| defaultReturn  | symbol             | a symbol that may be returned to instruct the renderer to evaluate the element normally


### opts.shouldUpdate (optional)

Dynamic rendering updates the render result whenever React's state tree updates. This can be very expensive; the dynamic renderer prevents changes from bubbling up if the return values of the `reduce` function is equal to its previous return value. By default equality is established by reference equality, `previous === next`, but often it's preferable to implement custom equality logic.

```javascript
function shouldUpdate(previousValue, nextValue) {
  return before.value !== after.value;
}
```

**IMPORTANT:** Since there is no concept of state updates in static rendering, this method is only meaningful in dynamic rendering.

### opts.suppressWarnings (optional)

The renderers will warn you if a class uses lifecycle functions that aren't supported. For example, static rendering does not execute the `useEffect()` or `useLayoutEffect()` hooks - this behaviour is modeled after `react-dom/server`. When developing a new renderer it is easy to forget about these considerations, and these warnings are designed to help diagose unexpected behaviour. However, once a reducer is functionally complete and working as expected, it is no longer desireable to raise these warnings every time it is used, so they can be disabled by setting `suppressWarnings: true`. 

### A complete example

The following is a simplified version of the `extractText` renderer:

<details>
  <summary>Click to see the full example</summary>

  ```javascript
  function reduce({element, unbox}) {
    if (element === null || element === undefined) {
      // returning undefined ensures that the result is omitted entirely.
      // this will be important later when we insert spaces between results...
      return undefined;
    }

    if(typeof element === "string" || typeof element === "number") {
      // return the values of text nodes: they form the basis
      // of what our renderer wants to return.
      return `${element}`
    }

    // for everything else, we really just want to concatenate the values
    // of all contained elements together.
    return unbox(childValueArray => {
      return childValueArray.join(" ");
    })
  }

  function finalTransform(arrayOfChildren) {
    // It's nicer to return a string, rather than an array,
    // so unpack that here
    return arrayOfChildren[0];
  }

  function shouldUpdate(before, after) {
    // since reduce returns simple strings, we can just compare them
    // directly (note: this is also the default behaviour)
    return before !== after; 
  }

  function getContents({element, defaultReturn}) {
    // let's teach our renderer to extract text from all react-router-dom Routes!
    if (element && element.type === Route) {
      return element.props.children;
    }

    // default fallback - just do what react-dom would do!
    return defaultReturn;
  }

  const myTextExtractor =  new ReducerFunction({
    reduce,
    finalTransform,
    shouldUpdate,
    getContents,
    suppressWarnings: true
  });

  const text = traverseDepthFirst(
    <App />,
    myTextExtractor
  );
  ```
</details>

## Using ReducerFunctions

Component trees can either be evaluated as a one-off, or be instrumented as they are mounted to React's virtual DOM, subscribing to updated render results.

### Static rendering 

To render your component tree as a one off, simply invoke traverseDepthFirst

```javascript
const text = traverseDepthFirst(
  <App />,
  extractText
)
```

The component tree will be evaluated in the same way as server-side rendering works: all components are initialised but `useLayoutEffect()`, `useEffect()` and the `component???Mount()` methods are not called.

### Dynamic rendering

To monitor a component mounted in the DOM, and subscribe to changes in the render result, wrap it in a `<Reducer>` component:

```javascript
const App = () => {
  const [text, setText] = useState('');
  return (
    <Reducer reducerFunction={extractText} onFinish={setText}>
      <MyComponent1 />
      <MyComponent2 />
    </Reducer>
  )
};
```

Reducer components can appear anywhere in the component tree, and can even be nested! 

| Name            | Type            | Required | Description
|-----------------|-----------------|----------|--------------
| reducerFunction | ReducerFunction | yes      | The ReducerFunction to be used to generate the renderResult
| onFinish        | function        | yes      | The callback to be invoked with the render result

When a component re-renders, ReducerFunction.reduce is used to re-evaluate its value and it gets bubbled up to the root of the reducer by re-evaluating the `reduce` function on that level with the updated childValue. On every level, if `shouldUpdate` evaluates to false, propagation is stopped - but if it reaches the root level of the reducer, the `onFinish` callback is invoked with the new value.

## Changing what gets rendered

**react-traversal** comes with a `<Substituting>` component that you can use to rewrite the component tree dynamically as it gets rendered. Examples for when this might be useful include:

* replacing `<input>` elements with read-only `<spans>`
* injecting new elements, such as admin buttons, into a UI
* replace interactive elements with equivalents that perform feature usage reporting
* add additional functionality, such as internationalisation, to legacy components or shared components that you can not directly modify.

<details>
  <summary>Fun fact</summary>

  The dynamic rendering functionality of `<Reducer>` is built on the implementation of `<Substituting>` - it works by replacing every react component with an equivalent that invokes update-callbacks into `<Reducer>` when it gets re-rendered. `<Substituting>` is surprisingly versatile!
</details>

For example, the following implementation replaces `<input>` HTML elements with `<FancyInput>` components:

```javascript
  import { Substituting } from 'react-traversal'
  import { FancyInput } from './myComponents'

  const mapInputToFancy = ({element}) => {
    if (element && element.type === "input") {
      // the current element is a HTML "input" - return a replacement,
      // copying the elements props (which will include any children)
      // but also copying in the element's ref and key, if they are set.
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
    <Substituting mapElement={mapInputToFancy}>
      <MyForm />
    </Substituting>
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

`mapElement` should return either:

**EITHER**: a new react element to be rendered instead of `element` - can also be a string/number value, or `null`.

**OR**: an array where the first entry is the element to be rendered (as above), and the second entry is a memo to be passed on to children as the value of `memo` when `mapElement` is called for them. This is for advanced use-cases where you need to pass contextual information to determine the correct element to be rendered.


## Tips and tricks

### Use static rendering within components

The `traverseDepthFirst` method may be used in the render function of React components. If it is invoked in a render function, the `getContext` function passed to the `reduce` function has access to the context values seen by the current component, ensuring that contexts are correctly interpreted.

### Memoise render results

A full static rendering function can be expensive, as it's cost scales with the number of React elements traversed. When using static rendering as part of a component render, it's a good idea to make sure that the render result only gets refreshed when it has to - use `React.useMemo()` to reuse render results across render cycles.

### Prefer static rendering when possible

Implementing dynamic renderers can be very challenging: A defect in the `shouldUpdate` function can easily lead to infitnite update loops or too frequent invocations of the onFinish callback. By using static renderers within components (see previous tip) and smart use of the `getContents` function, many use cases that at first seem to call for dynamic evaluation can, in fact, be done statically. This is particularly useful because static renderers can run server-side, widening their application to non-UI concerns.

However, dynamic rendering does have valid applications, particularly when interfacing with legacy components, or when the render result is used to respond to user input. However, care should be taken to test dynamic solutions thoroughly, and should be checked for performance issues

### Make shouldUpdate effective

Another consideration for dynamic rendering is that `reduce` and `shouldUpdate` can be executed very frequently - up to the number of react elements for every React update. To make this perform well, it's important to make sure both functions are fast to execute, and that redundant updates are stopped early by shouldUpdate - values from small component branches are usually faster to compare than large component trees.

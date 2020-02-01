# react-inline-props

This [React](https://github.com/facebook/react/) library provides a nice syntax for inline property injection, offering an alternative to render-props and render functions.

```bash
npm install react-inline-props
```

Part of the [eigencode](https://github.com/the-daniel-rothig/eigencode) project.

## Background

Render-props, or render functions, are a pattern in React to pass callbacks and values down the component tree. For example, a `<Submit />` component could provide a form submission callback and delegate the display logic to its children:

```javascript
<Submit>
  {(submit) => (
    <>
      <button onClick={submit}>Continue</button>
      <span className="hint">Your card will not be charged yet</span>
    </>
  )}
</Submit>
```

This is powerful, but a bit verbose: some of the lines in this example don't provide much information to the reader. It would be nice if it could be written like this:

```javascript
<Submit>
  <button onClick={submit}>Continue</button>
  <span className="hint">your card will not be charged yet</span>
</Submit>
```

**react-inline-props** allows you to modify your render-prop components to enable this cleaner syntax.

## Usage

To define a component that supports inline-props:

```javascript
// Starting from a conventional render-prop component:
const Submit = ({children}) => {
  const formContext = useContext(FormContext);
  const submit = formContext ? formContext.submit : () => {};
  return children(submit);
}

// ...we pass it to the withInlineProps function,
// specifying the intended names of the inline-props
// we want to create. 
const [SubmitInline, props] = withInlineProps('submit')(Submit);

// The first entry of the returned array is the inline-props enabled
// component:
export default SubmitInline;

// The second entry is an object containing the inline-props.
// We specified that the first (and only) argument of Submit's render-prop
// callback should be associated with an inline-prop called 'submit',
// and we export it explicitly for convenience.
export const { submit } = props;
```

And to use it:

```javascript
import Submit, { submit } from './Submit';

const App = () => (
  <Form>
    <Fields>
      {/* your form contents etc...*/} 
    </Fields>
    <Submit>
      <button onClick={submit}>Continue</button>
    </Submit>
  </Submit>
)
```

You can use the `submit` prop anywhere within `<Submit />`'s children tree:

```javascript
<Submit>
  <FancyWidget>
    This button is not a direct child of Submit, but the inline-prop works nevertheless.
    <button onClick={submit}>Continue</button>
  </FancyWidget>
</Submit>
```

## Derived inline-props

You can also transform the inline-props: the following adds some console logging to the button click event

```javascript
<Submit>
  <button onClick={submit.map(cb => 
    event => {
      event.preventDefault();
      console.log('about to submit...');
      cb();
      console.log('done');
    }
  )}>
    Continue
  </button>
</Submit>
```

It's possible to declare such mappings statically, outside of the component tree, to keep things tidy:

```javascript
import Submit, { submit } from './Submit';

const logAndSubmit = submit.map(cb => 
  event => {
    console.log('about to submit')
    // ...other stuff...
    cb();
  }
);

// later in the file:
<Submit>
  <button onClick={logAndSubmit}>Continue</button>
</Submit>
```

Mappings can be useful for making the structure of object-type render arguments more easily accessible. If a `<UserData />` component passes an object argument with the fields `{ firstName, lastName }`, it's a good idea to export some derived inline-props for convenience:

```javascript
import UserDataBase from './UserData'

const [ UserData, { userData } ] = withInlineProps('userData')(UserDataBase);

export default UserData;
export const firstName = userData.map(x => x.firstName);
export const lastName = userData.map(x => x.lastName);
export const fullName = userData.map(x => `${x.firstName} ${x.lastName}`);
```

This is now very convenient to use:

```javascript
import UserData, { firstName, lastName, fullName } from './UserDataInline';

<UserData>
  <span>Your first name is: {firstName}</span>
  <span>Your last name is: {lastName}</span>
  <span>Your full name, when shouted, is: {fullName.map(x => x.toUpperCase())}</span>
</UserData>
```

## Component nesting

When inline-prop enabled components are nested, inline-props get linked to the closest ancestor:

```javascript
const { Provider, Consumer } = React.createContext();

const [ Ctx, {ctx} ] = withInlineProps('ctx')(Consumer);

<Provider value="outer">
  <Ctx>
    <span>This reads "outer": {ctx}<span>
    <Provider value="inner">
      <span>This also reads "outer": {ctx}</span>
      <Ctx>
        <span>This reads "inner": {ctx}</span>
      </Ctx>
    </Provider>
  </Ctx>
</Provider>
```

To access the values from a component other than the closest ancestor, you can set a `propId` prop on the inline-prop enabled component and use the `.from(propId)` method on the inline-prop:

```javascript
<Provider value="outer">
  <Ctx propId="theOuterOne">
    <Provider value="inner">
      <Ctx>
        <span>"inner": {ctx} </span>
        <span>"outer": {ctx.from("theOuterOne")}</span>
      </Ctx>
    </Provider>
  </Ctx>
</Provider>
```

(Hint: the `.from()` and `.map()` methods on the inline-prop can be chained!) 

## Combining inline-props

Sometimes, you want to combine multiple props. For example, when a `<User />` component passes the number of articles read, and a `<Blog />` component provides the total number of articles, you may want to substract one from the other to indicate how many unread articles there are. With render-props, you would write:

```javascript
<User>
  ({articlesRead}) => (
    <Blog>
      ({totalArticles}) => (
        You have {totalArticles - articlesRead} articles left to read.
      )
    </Blog>
  )
</User>
```

With inline-props, you use the `combine` method:

```javascript
<User>
  <Blog>
    You have 
    {totalArticles.combine(articlesRead, (total, read) => total - read)} 
    articles left to read.
  </Blog>
</User>
```

The first argument of the `combine` method can also be an array of inline-props, for when you want to combine three props or more.

As with mappings, you can define combinations statically, to keep your code tidy - and you can chain map functions onto `combine`:

```javascript
const unreadCount = totalArticles.combine(
  [articlesRead],
  (total, read) => total - read
);

const unreadString = unreadCount.map(x => x <= 50 ? `${x}` : "over 50");

<User>
  <Blog>
    You have {unreadString} articles left to read.
  </Blog>
</User>
```

Finally, using `.combine()` in conjunction with `.from()` allows you to combine values from multiple scope levels:

```javascript
const [ WordProvider, { word } ] = withInlineProps('word')(
  ({word, children}) => children(word);
);

// the combined result is "hello world"

<WordProvider word="hello" propId="outer">
  <WordProvider word="world">
    {word.combine(
      [word.from('outer')], 
      (inner, outer) => `${outer} ${inner}`)}
  </WordProvider>
</WordProvider>
```

Don't over-rely on inline-props any more than on render-props though - it is intended for inlining simple stuff. For more advanced scenarios, use Higher-Order Components and Hooks.

## Expressing inline-prop ownership

When working with multiple inline-prop enabled components, it can get difficult for the reader to recognise which inline-props come from which component. An often successful solution to this is to attach the inline-props to the component types themselves:

```javascript
const [Blog, blogProps] = withInlineProps('totalArticles')(BaseBlog);
const [User, userProps] = withInlineProps('articlesRead')(BaseUser);

Object.assign(Blog, blogProps);
Object.assign(User, userProps);

// later:

<Blog>
  <User>
    You have read {User.articlesRead} of {Blog.totalArticles} articles.
  </User>
</Blog>
```

## Converting props other than `children`

By default, `withInlineProps` assumes that the render-prop to be converted is `children`. You can convert any number of other props by using the full signature of `withInlineProps`. 

Imagine a `<Page />` layout with a `footer` render-prop that passes in `index` and `totalPageCount` arguments: 

```javascript
<Page 
  footer={(index, totalPageCount) => (
    <span className="hint">Page {index + 1} of {totalPageCount}</span>
  )}
>
  {/* ... page contents ... */}
</Page>
```

To start using inline-props:

```javascript
import BasePage from './Page'

const [Page, props] = withInlineProps({
  footer: ['index', 'totalPageCount']
})(BasePage)

export default Page;

export const index = props.footer.index;
export const totalPageCount = props.footer.totalPageCount;
```

As you can see, instead of an arguments list of names for the `children` callback, an options object is passed whose keys are the names of the render-props, and the values the corresponding inline-prop names (a string or array of strings).

Note also that the structure of the returned `props` object is diffent: rather than an object containing the inline-props associated with the `children` callback, it's now an object with one entry per specified component prop, whose values are the objects containing the inline-props for each component prop. 

<details>
  <summary>More on the props object strucutre</summary>
  
  In the above example, we only instrumented one component prop - `footer` - but if we had instrumented others, like a `header` or the `children` prop, their entries would be in the `props` object as well. E.g. if we write:

  ```javascript
  const [ Page, props ] = withInlineProps({
    header: ["title", ...],
    children: ["default Font", ...],
    footer: ["index", "totalPageCount"],
  })(BasePage);
  ```

  The resulting `props` object has the following structure:

  ```javascript
  props = {
    header: {
      title: (InlineProp),
      // ... and other props ...
    },
    children: {
      defaultFont: (InlineProp),
      // ... and other props ...
    },
    footer: {
      index: (InlineProp),
      totalPageCount: (InlineProp)
    }
  }
  ```
</details>

Use the inline-prop enabled `<Page />` as follows:

```javascript
import Page, { index, totalPageCount } from './PageInline'

<Page
  footer={
    <span className="hint">Page {index.map(i => i+1)} of {totalPageCount}</span>
  }
>
  {/* ... page contents ... */}
</Page>
```

<details>
  <summary>Defining the footer at the bottom of the page</summary>

  Since footers appear at the bottom of a page, it is a bit counter-intuitive to have to declare the footer prop above the main content of the `<Page />` component. To further improve readability, you could convert `<Page />` to use the slot pattern:

  ```javascript
  <Page>
    {/* ... page contents ... */}
    <Page.Footer>
      <span className="hint">Page {index.map(i => i+1)} of {totalPageCount}</span>
    </Page.Footer>
  </Page>
  ```
</details>

## Gotchas

Beware: inline-props cannot be used in expressions and function bodies. Inline-props are just placeholders that will get swapped out with their real values only if they are an element in the tree, or a direct prop of an element in the tree. The following won't work:

```javascript
<Submit>
  This doesn't work: {submit.name.toUpperCase()}.

  <button onClick={() => {
    console.log("This also doesn't work")
    submit();
  }}>
    Continue
  </button>
</Submit>
```

This, however, does work:

```javascript
<Submit>
  This is the name of the submit function: {submit.map(cb => cb.name.toUpperCase())}

  <button onClick={submit.map(cb => () => {
    console.log("This works!");
    cb();
  })}>
</Submit>
```

Another consideration is that inline-props do not work when they are encapsulated by a component. For example:

```javascript
import Submit, { submit } from './Submit';

const ButtonThatUsesSubmit = () => (
  <button onClick={submit}>This button doesn't work!</button>
);

<Submit>
  <ButtonThatUsesSubmit />
</Submit>
```

The button in the example above does not work because the `submit` prop isn't used in-line with the `<Submit />` component. We say the prop is "shadowed" - it's inside the implementation of another component, and as such, invisible to the `<Submit />`.

On the other hand, element variables passed into the `<Submit />` don't "shadow" the prop, so that the following **does** work:

```javascript
import Submit, { submit } from './Submit';

const buttonElement = (
  <button onClick={submit}>This button works!</button>
);

<Submit>
  {buttonElement}
</Submit>
```

## API

### `withInlineProps(opts)(Component)`

Converts a React `Component` that uses render-props into one that uses inline-props.

**`opts`** is an object whose keys are the names of `Component`'s render-props; the values are the names of the inline-props to be assiociated with the render function arguments. They can be an array of strings, or a single string (for single argument functions).

**`Component`** is any React component that uses render-props.

The **return value** is an array with two entries. The first is the inline-prop enabled component, the second one is a `props` object. `props` has the same keys as `opts`, the values are objects who have an InlineProp against each key string provided in `opts`. For example, if `opts = { myProp: ['a', 'b'] }`, then `props = { myProp: { a: (InlineProp), b: (InlineProp) } }`.

### `withInlineProps(args...)(Component)`

Shorthand for `withInlineProps({ children: args })(Component)`. 

The **return value** is an array with two entries. The first is the inline-prop enabled component as before, the second one is an object containing InlineProp entries for each of the `args`. For example, if `args = ['a', 'b']` then `props = { a: (InlineProp), b: (InlineProp) }`.

### `InlineProp`

These can be placed anywhere inside their inline-prop enabled components, or set to any prop of elements contained by the component. They will be set to the value passed by the inline-prop enabled component when it renders.

Moreover, inline-props have the following methods against them:

**`inlineProp.map(callback)`** returns a new InlineProp that behaves like `inlineProp`, but before it is rendered, passes its value to callback and renders callback's return value instead.

**`inlineProp.from(propId)`** returns a new InlineProp that behaves like `inlineProp`, but retrieves its value from a specific render-prop component (not the closest ancestor, which is the default). The `propId` value is compared to the `propId` prop of any enclosing component that supplies the `inlineProp`. Calls to `from()` can be chained together, with the last one overwriting the previous `propId` choice. If called without an argument, `.from()` reconnects the inline-prop to the closest ancestor.

**`inlineProp.combine(otherProps, mappingFunction)`** returns a `CombinedInlineProp` that collects the values of all specified inline-props, and passes them as arguments to `mappingFunction`. It resolves to the return value of mapping function. `otherProps` can either be an array of InlineProps, or just a single InlineProp.

### `CombinedInlineProp`

These can be placed anywhere inside their inline-prop enabled components, or set to any prop of elements contained by the component. They will be set to the value returned by their `mappingFunction`(see `inlineProp.combine`), which is passed the values of all InlineProps this depends on. 

Moreover, CombinedInlineProp has the following method:

**`combinedInlineProp.map(callback)`** returns a new CombinedInlineProp that behaves like `combinedInlineProp` but further transforms the result of `mappingFunction` by passing it to `callback`, and using `callback`'s return value instead.
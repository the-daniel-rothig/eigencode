import React, { useState } from 'react';
import withFilteredContext from './withFilteredContext';
import { render } from '@testing-library/react';

const Context = React.createContext();

let componentCount = 0;

const Component = ({message, children}) => {
  componentCount++;
  return <div>{message}{children}</div>
};

const Hoc = withFilteredContext({
  of: Context,
  map: x => ({ message: `massive ${x}`}),
  isUnchanged: (prev, next) => prev === next
})(Component);

let setProviderState = null;

const Provider = ({children}) => {
  const [state, setState] = useState('success');
  setProviderState = setState;
  return <Context.Provider value={state}>{children}</Context.Provider>
}

beforeEach(() => {
  componentCount = 0;
  setProviderState = null;
})

it('renders the component with the filtered context', () => {
  const { getByText } = render(
    <Provider>
      <Hoc />
    </Provider>
  );

  expect(getByText('massive success')).toBeTruthy();
});

it('passes through component props', () => {
  const { getByText } = render(
    <Provider>
      <Hoc>!!</Hoc>
    </Provider>
  );

  expect(getByText('massive success!!')).toBeTruthy();
})

it('prefers explicit props to the injected ones', () => {
  const { getByText } = render(
    <Provider>
      <Hoc message='foobar' />
    </Provider>
  );

  expect(getByText('foobar')).toBeTruthy();
})

it('filters context changes', () => {
  render (
    <Provider>
      <Hoc />
    </Provider>
  );

  expect(componentCount).toBe(1);

  setProviderState('success') // same value
  
  expect(componentCount).toBe(1);

  setProviderState('success!!') // different value

  expect(componentCount).toBe(2);
});

it('correctly sets the display name', () => {
  const ComponentWithoutDisplayName = () => <span />;
  const ComponentWithDisplayName = () => <span />;
  ComponentWithDisplayName.displayName = "TheDisplayName";

  const HocWithout = withFilteredContext()(ComponentWithoutDisplayName);
  const HocWith = withFilteredContext()(ComponentWithDisplayName);

  expect(HocWithout.displayName).toBe("ComponentWithoutDisplayName");
  expect(HocWith.displayName).toBe("TheDisplayName");
})

it('accepts a callback for props', () => {
  const CustomHoc = withFilteredContext(({prefix}) => ({
    of: Context,
    map: x => ({message: `${prefix} ${x}`})
  }))(Component);

  const { getByText } = render(
    <Provider>
      <CustomHoc prefix="huge" />
    </Provider>
  )

  expect(getByText('huge success')).toBeTruthy();
})

const Context2 = React.createContext();

const CombinedHoc = withFilteredContext({
  of: [Context, Context2],
  to: Context,
  map: (ctx, ctx2) => ({message: `${ctx2} ${ctx}`}),
  isUnchanged: (prev, next) => prev === next
})(Component);

it('works with multiple context types', () => {
  const { getByText } = render(
    <Context.Provider value='success'>
      <Context2.Provider value='huge'>
        <CombinedHoc />
      </Context2.Provider>
    </Context.Provider>
  )

  expect(getByText('huge success')).toBeTruthy();
})

it('guards updates when multiple context types are used', () => {
  render(
    <Provider>
      <Context2.Provider value='huge'>
        <CombinedHoc />
      </Context2.Provider>
    </Provider>
  );

  expect(componentCount).toBe(1);

  setProviderState('success') // same value
  
  expect(componentCount).toBe(1);

  setProviderState('success!!') // different value

  expect(componentCount).toBe(2);
})

it('uses a throwaway context type when no `to` option is given', () => {
  const HocWithoutTo = withFilteredContext({
    of: [Context, Context2],
    map: (ctx, ctx2) => ({message: `${ctx2} ${ctx}`})
  })(Component)

  const { getByText } = render(
    <Context.Provider value='success'>
      <Context2.Provider value='huge'>
        <HocWithoutTo />
      </Context2.Provider>
    </Context.Provider>
  )

  expect(getByText('huge success')).toBeTruthy();
})


it('gives a context prop if the map return value is plain', () => {
  const PlainHoc = withFilteredContext({
    of: Context,
    map: x => x
  })(({context}) => <span>{context}</span>)

  const { getByText } = render(
    <Context.Provider value='success'>
      <PlainHoc />
    </Context.Provider>
  )

  expect(getByText('success')).toBeTruthy();
})
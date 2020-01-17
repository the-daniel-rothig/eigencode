import React, { useState, useContext } from 'react';
import { render } from '@testing-library/react';
import ContextFilter from './ContextFilter';
import { act } from 'react-dom/test-utils';

const Context = React.createContext()

it('converts context', () => {
  const probe = jest.fn()
  const Surrounding = ({children}) => {
    const [foo, setFoo] = useState(0)
    const [bar, setBar] = useState(0)

    return (
      <>
        <Context.Provider value={{foo, bar}}>
          {children}
        </Context.Provider>
        <button onClick={() => setFoo(foo+1)}>increment foo</button>
        <button onClick={() => setBar(bar+1)}>increment bar</button>
      </>
    )
  }
  
  const Probe = () => {
    const ctx = useContext(Context);
    probe();
    return <div data-testid='probe'>{ctx}</div>
  }

  const { getByText, getByTestId } = render(
    <Surrounding>
      <ContextFilter of={Context} map={one => one.foo}>
        <Probe />
      </ContextFilter>
    </Surrounding>
  )

  expect(probe).toHaveBeenCalledTimes(1)
  expect(getByTestId("probe").innerHTML).toBe("0")
  
  getByText('increment bar').click()
  expect(probe).toHaveBeenCalledTimes(1)
  expect(getByTestId("probe").innerHTML).toBe("0")
  
  getByText('increment foo').click()
  expect(probe).toHaveBeenCalledTimes(2)
  expect(getByTestId("probe").innerHTML).toBe("1")
});

const Provider = ({children}) => {
  const [state, setState] = useState('before');
  return <Context.Provider value={{state, setState}}>{children}</Context.Provider>
}

it('stops propagation if the context changes insufficiently', async () => {
  let hitCount = 0;
  const Probe = () => {
    hitCount += 1;
    return null;
  }

  const Component = () => {
    return (
      <Provider>
        <ContextFilter of={Context} map={x => x} isUnchanged={() => false}>
          <Probe />
          <Context.Consumer>
            {ctx => ctx.state === 'before' && <button onClick={() => ctx.setState('after')}>click me</button>}
          </Context.Consumer>
        </ContextFilter>
      </Provider>
    )
  }

  const {queryByText} = render(<Component />);
  expect(hitCount).toBe(1)
  await act(() => queryByText('click me').click());
  expect(hitCount).toBe(1);
  expect(queryByText('click me')).not.toBeTruthy();
})

it('permits propagation if there is an update not purely motivated by Context changes', async () => {
  let hitCount = 0;
  const Probe = () => {
    hitCount += 1;
    return null;
  }

  const Component = () => {
    const [state, setState] = useState('before');
    return (
      <Provider>
        <ContextFilter of={Context} map={x => x}>
          <Probe />
          {state === 'before' && <button onClick={() => setState('after')}>click me</button>}
        </ContextFilter>
      </Provider>
    )
  }

  const { queryByText } = render(<Component />)
  expect(hitCount).toBe(1)
  await act(() => queryByText('click me').click());
  expect(hitCount).toBe(2);
  expect(queryByText('click me')).not.toBeTruthy();
})